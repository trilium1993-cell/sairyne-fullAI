#include "PluginProcessor.h"
#include "PluginEditor.h"

std::atomic<int> SairyneAudioProcessor::liveInstances { 0 };

SairyneAudioProcessor::SairyneAudioProcessor()
{
	// Настроим файл-логгер, чтобы видеть сообщения и в консоли Xcode, и в файле
	auto logsDir = juce::File::getSpecialLocation(juce::File::userApplicationDataDirectory)
		.getChildFile("Sairyne");
	logsDir.createDirectory();
	auto logFile = logsDir.getChildFile("Sairyne.log");
	if (logFile.existsAsFile())
		logFile.deleteFile();
	fileLogger = std::make_unique<juce::FileLogger>(logFile, "Sairyne Debug Log", 0);
	juce::Logger::setCurrentLogger(fileLogger.get());

	// soft one-instance guard per process
	if (++liveInstances > 1)
	{
		masterOverlay = true;
	}

	DBG("SairyneAudioProcessor constructed");
	DBG("Log file: " + logFile.getFullPathName());

	// Extra: write to stderr and /tmp for visibility even without Logger
	std::fprintf(stderr, "[Sairyne] Processor constructed\n");
}

SairyneAudioProcessor::~SairyneAudioProcessor()
{
	DBG("SairyneAudioProcessor destructed");
	--liveInstances;
	juce::Logger::setCurrentLogger(nullptr);
	fileLogger.reset();
	propertiesFile.reset();
}

juce::PropertiesFile* SairyneAudioProcessor::getPropertiesFile()
{
	if (propertiesFile == nullptr)
	{
		juce::PropertiesFile::Options options;
		options.applicationName = "Sairyne";
		options.filenameSuffix = "settings";
		options.osxLibrarySubFolder = "Application Support";
		options.commonToAllUsers = false;
		options.ignoreCaseOfKeyNames = false;
		options.doNotSave = false;
		options.millisecondsBeforeSaving = 2000;
		options.storageFormat = juce::PropertiesFile::StorageFormat::storeAsXML;
		
		propertiesFile = std::make_unique<juce::PropertiesFile>(options);
		
		DBG("PropertiesFile created: " + propertiesFile->getFile().getFullPathName());
		juce::Logger::writeToLog("PropertiesFile created: " + propertiesFile->getFile().getFullPathName());
	}
	
	return propertiesFile.get();
}

juce::AudioProcessorEditor* SairyneAudioProcessor::createEditor()
{
	DBG("createEditor()");
	return new SairyneAudioProcessorEditor (*this);
}

std::unique_ptr<juce::Component> SairyneAudioProcessor::createWebViewComponent()
{
#if JUCE_MODULE_AVAILABLE_juce_gui_extra
	// Local subclass to expose current URL via Component::getName() on navigation
	struct HashReportingWebBrowser : public juce::WebBrowserComponent
	{
		HashReportingWebBrowser(SairyneAudioProcessor* processor)
			: juce::WebBrowserComponent (juce::WebBrowserComponent::Options{}
				.withNativeIntegrationEnabled()
				.withEventListener (juce::Identifier("sairyneResize"),
					[this](const juce::var& payload) { handleNativeResizeEvent (payload); })
				.withEventListener (juce::Identifier("openUrl"),
					[this](const juce::var& payload) { handleOpenUrlEvent (payload); })
				.withEventListener (juce::Identifier("saveData"),
					[this](const juce::var& payload) { handleSaveDataEvent (payload); })
				.withEventListener (juce::Identifier("loadData"),
					[this](const juce::var& payload) { handleLoadDataEvent (payload); })
				.withUserScript (getHelperScript()))
			, audioProcessor(processor)
		{
		}
		
		SairyneAudioProcessor* audioProcessor;

		static juce::String getHelperScript()
		{
			return R"JS(
				(function(){
					console.log('[Helper] 🔄 Helper script loaded');
					
					// Log JUCE availability
					console.log('[Helper] window.juce:', typeof window.juce);
					console.log('[Helper] window.juce.postMessage:', typeof (window.juce && window.juce.postMessage));
					console.log('[Helper] window.__JUCE__:', typeof window.__JUCE__);
					console.log('[Helper] window.__JUCE__.backend:', typeof (window.__JUCE__ && window.__JUCE__.backend));
					
					function tryAttach(retries) {
						if (!(window.__JUCE__ && window.__JUCE__.backend && typeof window.__JUCE__.backend.emitEvent === 'function')) {
							if (typeof retries === 'number' && retries > 0)
								setTimeout(function(){ tryAttach(retries - 1); }, 150);
							return;
						}

						var bridge = window.__JUCE__.backend;
						if (bridge.__sairyneBridgeAttached)
							return;
						bridge.__sairyneBridgeAttached = true;
						console.log('[Helper] ✅ Bridge attached');

						function emitResize(source, flag) {
							try {
								var expanded = !!flag;
								bridge.emitEvent('sairyneResize', { expanded: expanded, value: expanded ? '1' : '0', source: source });
							} catch (err) {
								try { bridge.emitEvent('sairyneResize', flag ? '1' : '0'); } catch (_) {}
							}
						}

						// Handle OPEN_URL messages from frontend
						function handleOpenUrl(url) {
							try {
								console.log('[Helper] handleOpenUrl called with:', url);
								if (bridge && typeof bridge.emitEvent === 'function') {
									console.log('[Helper] Using bridge.emitEvent');
									bridge.emitEvent('openUrl', { url: url });
								} else {
									console.log('[Helper] Using fallback custom scheme');
									// Fallback: use custom scheme
									location.href = 'sairyne://open_url?url=' + encodeURIComponent(url);
								}
							} catch (err) {
								console.error('[Helper] Failed to open URL:', err);
							}
						}

						// Intercept window.juce.postMessage to catch OPEN_URL and SAVE_DATA messages
						console.log('[Helper] 🔄 Checking window.juce.postMessage...');
						if (window.juce && typeof window.juce.postMessage === 'function') {
							console.log('[Helper] ✅ window.juce.postMessage found, intercepting...');
							var originalJucePostMessage = window.juce.postMessage;
							window.juce.postMessage = function(message) {
								console.log('[Helper] 📥 window.juce.postMessage called, message type:', typeof message, 'length:', message ? message.length : 0);
								try {
									if (typeof message === 'string') {
										var parsed = JSON.parse(message);
										console.log('[Helper] 📦 Parsed message type:', parsed ? parsed.type : 'null');
										// Handle OPEN_URL
										if (parsed && parsed.type === 'open_url' && parsed.payload && parsed.payload.url) {
											console.log('[Helper] Intercepted OPEN_URL:', parsed.payload.url);
											handleOpenUrl(parsed.payload.url);
											return; // Don't send to JUCE, we handle it ourselves
										}
						// Handle SAVE_DATA - send via JUCE event (preferred method)
						if (parsed && parsed.type === 'save_data' && parsed.payload) {
							var key = parsed.payload.key || '';
							var value = parsed.payload.value || '';
							console.log('[Helper] 🔄 Intercepted SAVE_DATA:', key, 'value length:', value.length);
							if (key && value) {
								// Get bridge reference (may not be available yet)
								var bridge = null;
								try {
									if (window.__JUCE__ && window.__JUCE__.backend) {
										bridge = window.__JUCE__.backend;
									}
								} catch (e) {
									console.warn('[Helper] Failed to get bridge:', e);
								}
								
								// Method 1: Try JUCE event via bridge.emitEvent (preferred - works in iframe)
								var eventSent = false;
								try {
									if (bridge && typeof bridge.emitEvent === 'function') {
										bridge.emitEvent('saveData', { key: key, value: value });
										console.log('[Helper] ✅ Sent saveData event via bridge.emitEvent');
										eventSent = true;
									} else {
										console.warn('[Helper] ⚠️ bridge.emitEvent not available, bridge=', bridge ? 'exists' : 'null');
									}
								} catch (e) {
									console.warn('[Helper] ❌ Failed to emit saveData event:', e);
								}
								
								// Method 2: Try direct __JUCE__ backend (alternative)
								if (!eventSent) {
									try {
										if (window.__JUCE__ && window.__JUCE__.backend && typeof window.__JUCE__.backend.emitEvent === 'function') {
											window.__JUCE__.backend.emitEvent('saveData', { key: key, value: value });
											console.log('[Helper] ✅ Sent saveData event via __JUCE__.backend.emitEvent');
											eventSent = true;
										} else {
											console.warn('[Helper] ⚠️ __JUCE__.backend.emitEvent not available');
										}
									} catch (e) {
										console.warn('[Helper] ❌ Failed to emit via __JUCE__:', e);
									}
								}
								
								// Method 3: Try postMessage to wrapper (if in iframe)
								if (!eventSent && window.parent && window.parent !== window) {
									try {
										window.parent.postMessage({ type: 'sairyne_save_data', key: key, value: value }, '*');
										console.log('[Helper] ✅ Sent postMessage to parent wrapper');
										eventSent = true;
									} catch (e) {
										console.warn('[Helper] ❌ Failed to send postMessage to parent:', e);
									}
								}
								
								// Method 4: Fallback to custom scheme URL (always try as backup)
								if (!eventSent) {
									var url = 'sairyne://save_data?key=' + encodeURIComponent(key) + '&value=' + encodeURIComponent(value);
									console.log('[Helper] 🔄 Fallback: Setting location.href to:', url.substring(0, 100) + '...');
									
									try {
										if (window.top && window.top !== window) {
											window.top.location.href = url;
											console.log('[Helper] ✅ Set location.href via window.top');
										} else {
											location.href = url;
											console.log('[Helper] ✅ Set location.href directly');
										}
									} catch (e) {
										console.warn('[Helper] ❌ Failed to set location.href:', e);
									}
								}
								
								return; // Don't send to JUCE, we handle it ourselves
							} else {
								console.warn('[Helper] ⚠️ SAVE_DATA missing key or value:', key, value ? 'has value' : 'no value');
							}
						}
						// Handle LOAD_DATA - send via JUCE event (preferred method)
						if (parsed && parsed.type === 'load_data' && parsed.payload) {
							var key = parsed.payload.key || '';
							console.log('[Helper] Intercepted LOAD_DATA:', key);
							if (key) {
								// Method 1: Try JUCE event via bridge.emitEvent (preferred - works in iframe)
								var eventSent = false;
								try {
									if (bridge && typeof bridge.emitEvent === 'function') {
										bridge.emitEvent('loadData', { key: key });
										console.log('[Helper] ✅ Sent loadData event via bridge.emitEvent');
										eventSent = true;
									} else {
										console.warn('[Helper] bridge.emitEvent not available');
									}
								} catch (e) {
									console.warn('[Helper] Failed to emit loadData event:', e);
								}
								
								// Method 2: Try direct __JUCE__ backend (alternative)
								if (!eventSent) {
									try {
										if (window.__JUCE__ && window.__JUCE__.backend && typeof window.__JUCE__.backend.emitEvent === 'function') {
											window.__JUCE__.backend.emitEvent('loadData', { key: key });
											console.log('[Helper] ✅ Sent loadData event via __JUCE__.backend.emitEvent');
											eventSent = true;
										}
									} catch (e) {
										console.warn('[Helper] Failed to emit via __JUCE__:', e);
									}
								}
								
								// Method 3: Try postMessage to wrapper (if in iframe)
								if (!eventSent && window.parent && window.parent !== window) {
									try {
										window.parent.postMessage({ type: 'sairyne_load_data', key: key }, '*');
										console.log('[Helper] ✅ Sent postMessage to parent wrapper');
										eventSent = true;
									} catch (e) {
										console.warn('[Helper] ❌ Failed to send postMessage to parent:', e);
									}
								}
								
								// Method 4: Fallback to custom scheme URL (always try as backup)
								if (!eventSent) {
									var url = 'sairyne://load_data?key=' + encodeURIComponent(key);
									console.log('[Helper] Fallback: Setting location.href to:', url);
									
									try {
										if (window.top && window.top !== window) {
											window.top.location.href = url;
										} else {
											location.href = url;
										}
									} catch (e) {
										// Cross-origin error, try direct location
										location.href = url;
									}
								}
								
								return; // Don't send to JUCE, we handle it ourselves
							} else {
								console.warn('[Helper] LOAD_DATA missing key');
							}
						}
									}
								} catch (e) {
									// Not JSON or not handled type, continue with original
								}
								console.log('[Helper] 📤 Forwarding original message to JUCE');
								return originalJucePostMessage.apply(this, arguments);
							};
							console.log('[Helper] ✅ window.juce.postMessage intercepted successfully');
						} else {
							console.warn('[Helper] ⚠️ window.juce.postMessage not found!');
							console.warn('[Helper] window.juce:', window.juce);
							console.warn('[Helper] typeof window.juce:', typeof window.juce);
						}

						// Intercept window.webkit.messageHandlers.juce.postMessage (for iOS/macOS)
						console.log('[Helper] 🔄 Checking window.webkit.messageHandlers.juce.postMessage...');
						if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.juce && typeof window.webkit.messageHandlers.juce.postMessage === 'function') {
							console.log('[Helper] ✅ window.webkit.messageHandlers.juce.postMessage found, intercepting...');
							var originalWebkitPostMessage = window.webkit.messageHandlers.juce.postMessage;
							window.webkit.messageHandlers.juce.postMessage = function(message) {
								console.log('[Helper] 📥 window.webkit.messageHandlers.juce.postMessage called');
								try {
									if (typeof message === 'string') {
										var parsed = JSON.parse(message);
										if (parsed && parsed.type === 'open_url' && parsed.payload && parsed.payload.url) {
											handleOpenUrl(parsed.payload.url);
											return; // Don't send to JUCE, we handle it ourselves
										}
									}
								} catch (e) {
									// Not JSON or not OPEN_URL, continue with original
								}
								return originalWebkitPostMessage.apply(this, arguments);
							};
							console.log('[Helper] ✅ window.webkit.messageHandlers.juce.postMessage intercepted');
						} else {
							console.log('[Helper] ℹ️ window.webkit.messageHandlers.juce.postMessage not found (this is normal for non-iOS)');
						}

						// Intercept window.postMessage to catch OPEN_URL messages (fallback)
						var originalPostMessage = window.postMessage;
						window.postMessage = function(message, targetOrigin, transfer) {
							try {
								// Handle string messages
								if (typeof message === 'string' && message.indexOf('sairyne:resize:') === 0) {
									var flag = message.split(':').pop() === '1';
									emitResize('postMessage', flag);
								}
								// Handle JSON messages from juceBridge
								else if (typeof message === 'string') {
									try {
										var parsed = JSON.parse(message);
										if (parsed && parsed.type === 'open_url' && parsed.payload && parsed.payload.url) {
											handleOpenUrl(parsed.payload.url);
											return; // Don't call original postMessage for OPEN_URL
										}
									} catch (e) {
										// Not JSON, continue with original postMessage
									}
								}
							} catch (err) {}
							return originalPostMessage.apply(this, arguments);
						};

						try { emitResize('init', false); } catch (err) {}

						var messageHandler = function(event){
							try {
								var payload = event.data;
								// Handle OPEN_URL messages from juceBridge
								if (typeof payload === 'string') {
									try {
										var parsed = JSON.parse(payload);
										if (parsed && parsed.type === 'open_url' && parsed.payload && parsed.payload.url) {
											handleOpenUrl(parsed.payload.url);
											return;
										}
									} catch (e) {
										// Not JSON, continue
									}
								}
								// Handle resize messages
								if (payload && payload.source === 'sairyne' && typeof payload.expanded !== 'undefined') {
									var flag = !!payload.expanded;
									emitResize('bridge-event', flag);
								} else if (typeof payload === 'string' && payload.indexOf('sairyne:resize:') === 0) {
									var flag = payload.split(':').pop() === '1';
									emitResize('message-string', flag);
								}
							} catch (err) {}
						};

						window.addEventListener('message', messageHandler, false);
						window.addEventListener('message', messageHandler, true);

						window.addEventListener('hashchange', function(){
							try {
								var hash = window.location.hash || '';
								if (hash.indexOf('#expanded=') >= 0) {
									emitResize('hashchange', hash.indexOf('#expanded=1') >= 0);
								}
							} catch (err) {}
						});
					}

					console.log('[Helper] 🔄 Starting bridge attachment with 40 retries...');
					tryAttach(40);
					console.log('[Helper] ✅ Helper script initialization complete');
					
					// Listen for data loaded from JUCE PropertiesFile
					window.addEventListener('message', function(e) {
						try {
							if (e.data && e.data.type === 'juce_data_loaded') {
								var key = e.data.key || '';
								var value = e.data.value || '';
								if (key && value) {
									// Call onJuceDataLoaded if available
									if (window.onJuceDataLoaded && typeof window.onJuceDataLoaded === 'function') {
										window.onJuceDataLoaded(key, value);
									}
									// Also try to store in localStorage if available
									try {
										if (window.localStorage) {
											window.localStorage.setItem(key, value);
										}
									} catch (e) {
										// localStorage may be blocked, ignore
									}
								}
							}
						} catch (err) {
							console.error('[Helper] Error handling juce_data_loaded:', err);
						}
					});
					
					// Test localStorage availability and try to enable it
					try {
						// Try to enable localStorage by setting a test value
						var testKey = '__sairyne_storage_test__';
						window.localStorage.setItem(testKey, 'test');
						var retrieved = window.localStorage.getItem(testKey);
						window.localStorage.removeItem(testKey);
						if (retrieved === 'test') {
							console.log('[Helper] localStorage is available and working');
							// Try to ensure persistence by accessing it
							try {
								window.localStorage.setItem('__sairyne_init__', '1');
							} catch (e) {}
						} else {
							console.warn('[Helper] localStorage test failed - data not persisted');
						}
					} catch (err) {
						console.error('[Helper] localStorage is not available:', err);
						console.error('[Helper] Error details:', err.message || err);
					}
				})();
			)JS";
		}

		bool pageAboutToLoad (const juce::String& newURL) override
		{
			// Log all juce:// URLs for debugging
			if (newURL.startsWithIgnoreCase("juce://"))
			{
				DBG("pageAboutToLoad -> juce:// URL: " + newURL.substring(0, 200));
				juce::Logger::writeToLog("pageAboutToLoad -> juce:// URL: " + newURL.substring(0, 200));
				
				// Handle juce:// messages
				if (handleJuceMessage(newURL))
				{
					return false; // Don't navigate, we handled it
				}
			}
			// Check if page finished loading (main site URL)
			else if (newURL.startsWithIgnoreCase("https://sairyne-ai.vercel.app/embed-chat.html"))
			{
				DBG("pageAboutToLoad -> Main page loaded, injecting saved data");
				juce::Logger::writeToLog("pageAboutToLoad -> Main page loaded, injecting saved data");
				
				// Inject saved data after a short delay to ensure page is ready
				juce::MessageManager::callAsync([this]()
				{
					juce::MessageManager::callAsync([this]()
					{
						injectSavedData();
					});
				});
			}
			else
			{
				DBG("pageAboutToLoad -> " + newURL.substring(0, 100));
				juce::Logger::writeToLog("pageAboutToLoad -> " + newURL.substring(0, 100));
			}

			setName(newURL);
			return true;
		}

		void newWindowAttemptingToLoad (const juce::String& newURL) override
		{
			// Log all sairyne:// URLs for debugging
			if (newURL.startsWithIgnoreCase("sairyne://"))
			{
				DBG("newWindowAttemptingToLoad -> sairyne:// URL: " + newURL.substring(0, 200));
				juce::Logger::writeToLog("newWindowAttemptingToLoad -> sairyne:// URL: " + newURL.substring(0, 200));
			}
			// Also handle juce:// URLs here (fallback if pageAboutToLoad doesn't catch them)
			else if (newURL.startsWithIgnoreCase("juce://"))
			{
				DBG("newWindowAttemptingToLoad -> juce:// URL: " + newURL.substring(0, 200));
				juce::Logger::writeToLog("newWindowAttemptingToLoad -> juce:// URL: " + newURL.substring(0, 200));
				
				// Try to handle it
				if (handleJuceMessage(newURL))
				{
					return; // Handled
				}
			}
			else
			{
				DBG("newWindowAttemptingToLoad -> " + newURL);
				juce::Logger::writeToLog("newWindowAttemptingToLoad -> " + newURL);
			}
			
			// If it's a custom scheme, handle it
			if (handleCustomScheme (newURL))
				return;
			
			// If it's a regular HTTP/HTTPS URL, open it in system browser
			if (newURL.startsWithIgnoreCase("http://") || newURL.startsWithIgnoreCase("https://"))
			{
				DBG("newWindowAttemptingToLoad: Opening URL in system browser: " + newURL);
				juce::Logger::writeToLog("newWindowAttemptingToLoad: Opening URL in system browser: " + newURL);
				bool success = juce::URL(newURL).launchInDefaultBrowser();
				DBG("newWindowAttemptingToLoad: launchInDefaultBrowser returned: " + juce::String(success ? "true" : "false"));
				juce::Logger::writeToLog("newWindowAttemptingToLoad: launchInDefaultBrowser returned: " + juce::String(success ? "true" : "false"));
			}
		}

	private:
		void handleNativeResizeEvent (const juce::var& payload)
		{
			bool expanded = false;

			if (payload.isBool())
			{
				expanded = static_cast<bool> (payload);
			}
			else if (payload.isString())
			{
				const auto flag = payload.toString().trim();
				expanded = flag.equalsIgnoreCase("1") || flag.equalsIgnoreCase("true") || flag.equalsIgnoreCase("expanded");
			}
			else if (const auto* obj = payload.getDynamicObject())
			{
				if (obj->hasProperty("expanded"))
					expanded = obj->getProperty("expanded");
				else if (obj->hasProperty("value"))
					expanded = obj->getProperty("value");
			}

			const juce::String marker = "sairyne://expanded=" + juce::String (expanded ? "1" : "0");
			DBG("nativeEvent sairyneResize -> " + marker);
			juce::Logger::writeToLog("nativeEvent sairyneResize -> " + marker);
			setName (marker);
		}

		// Unified handler for juce:// messages (replaces all sairyne:// handling)
		bool handleJuceMessage (const juce::String& newURL)
		{
			DBG("handleJuceMessage: " + newURL.substring(0, 200));
			juce::Logger::writeToLog("handleJuceMessage: " + newURL.substring(0, 200));
			
			if (!newURL.startsWithIgnoreCase("juce://"))
				return false;
			
			if (audioProcessor == nullptr)
			{
				DBG("handleJuceMessage: audioProcessor is null!");
				juce::Logger::writeToLog("handleJuceMessage: audioProcessor is null!");
				return false;
			}
			
			// Handle juce://save?key=...&value=...
			if (newURL.startsWithIgnoreCase("juce://save"))
			{
				DBG("handleJuceMessage: detected juce://save");
				juce::Logger::writeToLog("handleJuceMessage: detected juce://save");
				juce::Logger::writeToLog("handleJuceMessage: Full URL (first 500 chars): " + newURL.substring(0, 500));
				
				auto urlStart = newURL.indexOfChar('?');
				if (urlStart > 0)
				{
					auto query = newURL.substring(urlStart + 1);
					juce::String key, value;
					
					// Parse query string: key=...&value=...
					auto keyStart = query.indexOf("key=");
					auto valueStart = query.indexOf("value=");
					
					if (keyStart >= 0 && valueStart >= 0)
					{
						// Extract key (between key= and & or end)
						auto keySubstring = query.substring(keyStart + 4);
						auto keyEnd = keySubstring.indexOfChar('&');
						if (keyEnd < 0)
							key = keySubstring;
						else
							key = keySubstring.substring(0, keyEnd);
						
						// Extract value (everything after value=)
						value = query.substring(valueStart + 6);
						
						// URL decode
						key = key.replace("%3A", ":").replace("%2F", "/").replace("%3F", "?").replace("%3D", "=").replace("%26", "&").replace("%25", "%").replace("+", " ").replace("%20", " ").replace("%0A", "\n").replace("%0D", "\r").replace("%2B", "+");
						value = value.replace("%3A", ":").replace("%2F", "/").replace("%3F", "?").replace("%3D", "=").replace("%26", "&").replace("%25", "%").replace("+", " ").replace("%20", " ").replace("%0A", "\n").replace("%0D", "\r").replace("%2B", "+");
						
						if (key.isNotEmpty() && value.isNotEmpty())
						{
							DBG("handleJuceMessage: Processing save for key: " + key + ", value length: " + juce::String(value.length()));
							juce::Logger::writeToLog("handleJuceMessage: Processing save for key: " + key + ", value length: " + juce::String(value.length()));
							juce::Logger::writeToLog("handleJuceMessage: Value preview (first 200 chars): " + value.substring(0, 200));
							
							// Special handling for persistUsers and persistProjects
							if (key == "sairyne_users")
							{
								DBG("handleJuceMessage: 🎯 PERSISTUSERS CALLED - saving users data");
								juce::Logger::writeToLog("handleJuceMessage: 🎯 PERSISTUSERS CALLED - saving users data");
								juce::Logger::writeToLog("handleJuceMessage: Users JSON length: " + juce::String(value.length()));
							}
							else if (key == "sairyne_projects")
							{
								DBG("handleJuceMessage: 🎯 PERSISTPROJECTS CALLED - saving projects data");
								juce::Logger::writeToLog("handleJuceMessage: 🎯 PERSISTPROJECTS CALLED - saving projects data");
								juce::Logger::writeToLog("handleJuceMessage: Projects JSON length: " + juce::String(value.length()));
							}
							
							auto* props = audioProcessor->getPropertiesFile();
							if (props != nullptr)
							{
								DBG("handleJuceMessage: PropertiesFile is available, setting value...");
								juce::Logger::writeToLog("handleJuceMessage: PropertiesFile is available, setting value...");
								
								props->setValue(key, value);
								props->saveIfNeeded();
								
								// Force flush to disk
								props->save();
								
								// Verify the save worked
								auto savedValue = props->getValue(key, "");
								if (savedValue == value)
								{
									DBG("handleJuceMessage: ✅ Saved and verified data: " + key + " = " + value.substring(0, 50) + "...");
									juce::Logger::writeToLog("handleJuceMessage: ✅ Saved and verified data: " + key + " = " + value.substring(0, 50) + "...");
									juce::Logger::writeToLog("handleJuceMessage: PropertiesFile path: " + props->getFile().getFullPathName());
									
									// Special confirmation for persistUsers/persistProjects
									if (key == "sairyne_users")
									{
										DBG("handleJuceMessage: ✅✅✅ PERSISTUSERS SUCCESS - users data saved to PropertiesFile");
										juce::Logger::writeToLog("handleJuceMessage: ✅✅✅ PERSISTUSERS SUCCESS - users data saved to PropertiesFile");
									}
									else if (key == "sairyne_projects")
									{
										DBG("handleJuceMessage: ✅✅✅ PERSISTPROJECTS SUCCESS - projects data saved to PropertiesFile");
										juce::Logger::writeToLog("handleJuceMessage: ✅✅✅ PERSISTPROJECTS SUCCESS - projects data saved to PropertiesFile");
									}
								}
								else
								{
									DBG("handleJuceMessage: ⚠️ Save failed - value mismatch for key: " + key);
									juce::Logger::writeToLog("handleJuceMessage: ⚠️ Save failed - value mismatch for key: " + key);
									juce::Logger::writeToLog("handleJuceMessage: Expected length: " + juce::String(value.length()) + ", saved length: " + juce::String(savedValue.length()));
								}
								return true;
							}
							else
							{
								DBG("handleJuceMessage: PropertiesFile is null!");
								juce::Logger::writeToLog("handleJuceMessage: PropertiesFile is null!");
							}
						}
					}
				}
				return true;
			}
			// Handle juce://load?key=...
			else if (newURL.startsWithIgnoreCase("juce://load"))
			{
				DBG("handleJuceMessage: detected juce://load");
				juce::Logger::writeToLog("handleJuceMessage: detected juce://load");
				
				auto urlStart = newURL.indexOfChar('?');
				if (urlStart > 0)
				{
					auto query = newURL.substring(urlStart + 1);
					juce::String key;
					
					if (query.startsWithIgnoreCase("key="))
					{
						key = query.substring(4);
						// URL decode
						key = key.replace("%3A", ":").replace("%2F", "/").replace("%3F", "?").replace("%3D", "=").replace("%26", "&").replace("%25", "%").replace("+", " ");
						
						auto* props = audioProcessor->getPropertiesFile();
						if (props != nullptr)
						{
							auto value = props->getValue(key, "");
							if (value.isNotEmpty())
							{
								// Send data back to WebView via postMessage to iframe
								juce::String escapedValue = value.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r");
								juce::String escapedKey = key.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r");
								
								// Try both iframe postMessage and direct call (with retry)
								juce::String jsCode = 
									"(function() {"
									"  var key = '" + escapedKey + "';"
									"  var val = '" + escapedValue + "';"
									"  var iframe = document.getElementById('sairyne_iframe');"
									"  if (iframe && iframe.contentWindow) {"
									"    try {"
									"      iframe.contentWindow.postMessage({"
									"        type: 'juce_data_loaded',"
									"        key: key,"
									"        value: val"
									"      }, '*');"
									"      console.log('[JUCE Load] ✅ Sent juce_data_loaded to iframe:', key);"
									"    } catch(e) {"
									"      console.error('[JUCE Load] ❌ Error sending postMessage:', e);"
									"    }"
									"  }"
									"  if (window.onJuceDataLoaded && typeof window.onJuceDataLoaded === 'function') {"
									"    try {"
									"      window.onJuceDataLoaded(key, val);"
									"      console.log('[JUCE Load] ✅ Called window.onJuceDataLoaded directly:', key);"
									"    } catch(e) {"
									"      console.error('[JUCE Load] ❌ Error calling onJuceDataLoaded:', e);"
									"    }"
									"  }"
									"})();";
								
								evaluateJavascript(jsCode);
								DBG("handleJuceMessage: Loaded data: " + key + " = " + value.substring(0, 50) + "...");
								juce::Logger::writeToLog("handleJuceMessage: Loaded data: " + key + " = " + value.substring(0, 50) + "...");
							}
							else
							{
								// Send null/empty response to clear pending flag and prevent infinite loops
								juce::String escapedKey = key.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r");
								juce::String jsCode = "if (window.onJuceDataLoaded && typeof window.onJuceDataLoaded === 'function') { window.onJuceDataLoaded('" + escapedKey + "', ''); }";
								evaluateJavascript(jsCode);
								DBG("handleJuceMessage: No data found for key: " + key + " (sent empty response to clear pending flag)");
								juce::Logger::writeToLog("handleJuceMessage: No data found for key: " + key + " (sent empty response to clear pending flag)");
							}
						}
					}
				}
				return true;
			}
			// Handle juce://debug?message=... (for debugging)
			else if (newURL.startsWithIgnoreCase("juce://debug"))
			{
				DBG("handleJuceMessage: detected juce://debug");
				juce::Logger::writeToLog("handleJuceMessage: detected juce://debug");
				
				auto urlStart = newURL.indexOfChar('?');
				if (urlStart > 0)
				{
					auto query = newURL.substring(urlStart + 1);
					if (query.startsWithIgnoreCase("message="))
					{
						auto message = query.substring(8);
						// URL decode
						message = message.replace("%3A", ":").replace("%2F", "/").replace("%3F", "?").replace("%3D", "=").replace("%26", "&").replace("%25", "%").replace("+", " ").replace("%20", " ").replace("%0A", "\n").replace("%0D", "\r").replace("%2B", "+");
						DBG("handleJuceMessage: DEBUG MESSAGE: " + message);
						juce::Logger::writeToLog("handleJuceMessage: DEBUG MESSAGE: " + message);
					}
				}
				return true;
			}
			// Handle juce://open_url?url=...
			else if (newURL.startsWithIgnoreCase("juce://open_url"))
			{
				DBG("handleJuceMessage: detected juce://open_url");
				juce::Logger::writeToLog("handleJuceMessage: detected juce://open_url");
				
				auto urlStart = newURL.indexOfChar('?');
				if (urlStart > 0)
				{
					auto query = newURL.substring(urlStart + 1);
					if (query.startsWithIgnoreCase("url="))
					{
						auto url = query.substring(4);
						// URL decode
						juce::String decodedUrl;
						for (int i = 0; i < url.length(); ++i)
						{
							if (url[i] == '%' && i + 2 < url.length())
							{
								auto hex = url.substring(i + 1, 2);
								auto code = hex.getHexValue32();
								if (code > 0)
								{
									decodedUrl += juce::String::charToString((char)code);
									i += 2;
									continue;
								}
							}
							decodedUrl += url[i];
						}
						if (decodedUrl.isEmpty())
							decodedUrl = url;
						
						bool success = juce::URL(decodedUrl).launchInDefaultBrowser();
						DBG("handleJuceMessage: Opening URL in system browser: " + decodedUrl + " (success: " + juce::String(success ? "true" : "false") + ")");
						juce::Logger::writeToLog("handleJuceMessage: Opening URL in system browser: " + decodedUrl + " (success: " + juce::String(success ? "true" : "false") + ")");
					}
				}
				return true;
			}
			
			return false;
		}

		// Inject all saved data into WebView on plugin startup
		void injectSavedData()
		{
			if (audioProcessor == nullptr)
			{
				DBG("injectSavedData: audioProcessor is null!");
				juce::Logger::writeToLog("injectSavedData: audioProcessor is null!");
				return;
			}
			
			auto* props = audioProcessor->getPropertiesFile();
			if (props == nullptr)
			{
				DBG("injectSavedData: PropertiesFile is null!");
				juce::Logger::writeToLog("injectSavedData: PropertiesFile is null!");
				return;
			}
			
			// Get all keys we care about
			juce::StringArray keys;
			keys.add("sairyne_users");
			keys.add("sairyne_current_user");
			keys.add("sairyne_access_token");
			keys.add("sairyne_projects");
			keys.add("sairyne_selected_project");
			// Also inject chat/UI persistence keys
			keys.add("sairyne_functional_chat_state_v1");
			// Smoke-test key to verify save pipeline works end-to-end
			keys.add("sairyne_smoke_test");
			
			// Build JSON object with all saved data
			juce::String json = "{";
			bool first = true;
			int injectedCount = 0;
			for (const auto& key : keys)
			{
				auto value = props->getValue(key, "");
				if (value.isNotEmpty())
				{
					if (!first)
						json += ",";
					first = false;
					injectedCount++;
					
					// Escape JSON properly (handle all special characters)
					juce::String escapedKey = key.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
					juce::String escapedValue = value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
					json += "\"" + escapedKey + "\":\"" + escapedValue + "\"";
					
					DBG("injectSavedData: Adding key: " + key + " (value length: " + juce::String(value.length()) + ")");
					juce::Logger::writeToLog("injectSavedData: Adding key: " + key + " (value length: " + juce::String(value.length()) + ")");
				}
				else
				{
					DBG("injectSavedData: Key not found or empty: " + key);
					juce::Logger::writeToLog("injectSavedData: Key not found or empty: " + key);
				}
			}
			json += "}";
			
			if (injectedCount > 0) // Only inject if we have data
			{
				// Inject into iframe via postMessage with retry logic (iframe may not be ready yet)
				juce::String jsCode = 
					"(function() {"
					"  var jsonData = " + json + ";"
					"  var attempts = 0;"
					"  var maxAttempts = 10;"
					"  function tryInject() {"
					"    attempts++;"
					"    var iframe = document.getElementById('sairyne_iframe');"
					"    if (iframe && iframe.contentWindow) {"
					"      try {"
					"        iframe.contentWindow.postMessage({"
					"          type: 'juce_init',"
					"          data: jsonData"
					"        }, '*');"
					"        console.log('[JUCE Inject] ✅ Sent juce_init to iframe, attempt ' + attempts);"
					"      } catch(e) {"
					"        console.error('[JUCE Inject] ❌ Error sending postMessage:', e);"
					"      }"
					"    } else if (attempts < maxAttempts) {"
					"      setTimeout(tryInject, 200);"
					"    } else {"
					"      console.warn('[JUCE Inject] ⚠️ Iframe not found after ' + maxAttempts + ' attempts');"
					"    }"
					"    // Also try direct call (fallback)"
					"    if (window.onJuceInit && typeof window.onJuceInit === 'function') {"
					"      try {"
					"        window.onJuceInit(jsonData);"
					"        console.log('[JUCE Inject] ✅ Called window.onJuceInit directly');"
					"      } catch(e) {"
					"        console.error('[JUCE Inject] ❌ Error calling onJuceInit:', e);"
					"      }"
					"    }"
					"  }"
					"  tryInject();"
					"})();";
				
				DBG("injectSavedData: Executing JavaScript with " + juce::String(injectedCount) + " keys");
				juce::Logger::writeToLog("injectSavedData: Executing JavaScript with " + juce::String(injectedCount) + " keys");
				juce::Logger::writeToLog("injectSavedData: JSON length: " + juce::String(json.length()));
				evaluateJavascript(jsCode);
				DBG("injectSavedData: Injected " + juce::String(injectedCount) + " keys (with retry logic)");
				juce::Logger::writeToLog("injectSavedData: Injected " + juce::String(injectedCount) + " keys (with retry logic)");
			}
			else
			{
				DBG("injectSavedData: No saved data to inject");
				juce::Logger::writeToLog("injectSavedData: No saved data to inject");
			}
		}

		// Legacy handler (kept ONLY for sairyne://expanded=... for window resizing)
		bool handleCustomScheme (const juce::String& newURL)
		{
			// Only handle sairyne://expanded=... for window resizing (keep this functionality)
			if (newURL.startsWithIgnoreCase("sairyne://expanded="))
			{
				// This is handled by PluginEditor for window resizing
				return false; // Let it through
			}
			
			// Handle sairyne://open_url?url=... (fallback for open_url)
			if (newURL.startsWithIgnoreCase("sairyne://open_url"))
			{
				DBG("handleCustomScheme: detected sairyne://open_url");
				juce::Logger::writeToLog("handleCustomScheme: detected sairyne://open_url");
				
				auto urlStart = newURL.indexOfChar('?');
				if (urlStart > 0)
				{
					auto query = newURL.substring(urlStart + 1);
					if (query.startsWithIgnoreCase("url="))
					{
						auto url = query.substring(4);
						// URL decode
						juce::String decodedUrl;
						for (int i = 0; i < url.length(); ++i)
						{
							if (url[i] == '%' && i + 2 < url.length())
							{
								auto hex = url.substring(i + 1, 2);
								auto code = hex.getHexValue32();
								if (code > 0)
								{
									decodedUrl += juce::String::charToString((char)code);
									i += 2;
									continue;
								}
							}
							decodedUrl += url[i];
						}
						if (decodedUrl.isEmpty())
							decodedUrl = url;
						
						bool success = juce::URL(decodedUrl).launchInDefaultBrowser();
						DBG("handleCustomScheme: Opening URL in system browser: " + decodedUrl + " (success: " + juce::String(success ? "true" : "false") + ")");
						juce::Logger::writeToLog("handleCustomScheme: Opening URL in system browser: " + decodedUrl + " (success: " + juce::String(success ? "true" : "false") + ")");
						return true; // Handled
					}
				}
			}
			
			return false;
		}

		void handleOpenUrlEvent (const juce::var& payload)
		{
			DBG("handleOpenUrlEvent called");
			juce::Logger::writeToLog("handleOpenUrlEvent called");
			
			juce::String url;
			
			if (payload.isString())
			{
				url = payload.toString();
				DBG("handleOpenUrlEvent: payload is string: " + url);
				juce::Logger::writeToLog("handleOpenUrlEvent: payload is string: " + url);
			}
			else if (const auto* obj = payload.getDynamicObject())
			{
				DBG("handleOpenUrlEvent: payload is object");
				juce::Logger::writeToLog("handleOpenUrlEvent: payload is object");
				if (obj->hasProperty("url"))
				{
					url = obj->getProperty("url").toString();
					DBG("handleOpenUrlEvent: extracted url from object: " + url);
					juce::Logger::writeToLog("handleOpenUrlEvent: extracted url from object: " + url);
				}
				else
				{
					DBG("handleOpenUrlEvent: object has no 'url' property");
					juce::Logger::writeToLog("handleOpenUrlEvent: object has no 'url' property");
				}
			}
			else
			{
				DBG("handleOpenUrlEvent: payload is neither string nor object");
				juce::Logger::writeToLog("handleOpenUrlEvent: payload is neither string nor object");
			}
			
			if (url.isNotEmpty())
			{
				DBG("handleOpenUrlEvent: Opening URL in system browser: " + url);
				juce::Logger::writeToLog("handleOpenUrlEvent: Opening URL in system browser: " + url);
				bool success = juce::URL(url).launchInDefaultBrowser();
				DBG("handleOpenUrlEvent: launchInDefaultBrowser returned: " + juce::String(success ? "true" : "false"));
				juce::Logger::writeToLog("handleOpenUrlEvent: launchInDefaultBrowser returned: " + juce::String(success ? "true" : "false"));
			}
			else
			{
				DBG("handleOpenUrlEvent: URL is empty, cannot open");
				juce::Logger::writeToLog("handleOpenUrlEvent: URL is empty, cannot open");
			}
		}

		void handleSaveDataEvent (const juce::var& payload)
		{
			DBG("handleSaveDataEvent called");
			juce::Logger::writeToLog("handleSaveDataEvent called");
			
			if (audioProcessor == nullptr)
			{
				DBG("handleSaveDataEvent: audioProcessor is null!");
				juce::Logger::writeToLog("handleSaveDataEvent: audioProcessor is null!");
				return;
			}
			
			juce::String key, value;
			
			if (const auto* obj = payload.getDynamicObject())
			{
				if (obj->hasProperty("key"))
					key = obj->getProperty("key").toString();
				if (obj->hasProperty("value"))
					value = obj->getProperty("value").toString();
			}
			else if (payload.isString())
			{
				// Try to parse as JSON
				auto json = juce::JSON::parse(payload.toString());
				if (json.isObject())
				{
					auto* obj = json.getDynamicObject();
					if (obj->hasProperty("key"))
						key = obj->getProperty("key").toString();
					if (obj->hasProperty("value"))
						value = obj->getProperty("value").toString();
				}
			}
			
			if (key.isNotEmpty() && value.isNotEmpty())
			{
				auto* props = audioProcessor->getPropertiesFile();
				if (props != nullptr)
				{
					props->setValue(key, value);
					props->saveIfNeeded();
					DBG("handleSaveDataEvent: Saved data: " + key + " = " + value.substring(0, 50) + "...");
					juce::Logger::writeToLog("handleSaveDataEvent: Saved data: " + key + " = " + value.substring(0, 50) + "...");
					juce::Logger::writeToLog("handleSaveDataEvent: PropertiesFile path: " + props->getFile().getFullPathName());
				}
				else
				{
					DBG("handleSaveDataEvent: PropertiesFile is null!");
					juce::Logger::writeToLog("handleSaveDataEvent: PropertiesFile is null!");
				}
			}
			else
			{
				DBG("handleSaveDataEvent: key or value is empty! key=" + key + ", value length=" + juce::String(value.length()));
				juce::Logger::writeToLog("handleSaveDataEvent: key or value is empty! key=" + key + ", value length=" + juce::String(value.length()));
			}
		}

		void handleLoadDataEvent (const juce::var& payload)
		{
			DBG("handleLoadDataEvent called");
			juce::Logger::writeToLog("handleLoadDataEvent called");
			
			if (audioProcessor == nullptr)
			{
				DBG("handleLoadDataEvent: audioProcessor is null!");
				juce::Logger::writeToLog("handleLoadDataEvent: audioProcessor is null!");
				return;
			}
			
			juce::String key;
			
			if (const auto* obj = payload.getDynamicObject())
			{
				if (obj->hasProperty("key"))
					key = obj->getProperty("key").toString();
			}
			else if (payload.isString())
			{
				key = payload.toString();
			}
			
			if (key.isNotEmpty())
			{
				auto* props = audioProcessor->getPropertiesFile();
				if (props != nullptr)
				{
					auto value = props->getValue(key, "");
					if (value.isNotEmpty())
					{
						// Send data back via custom scheme (will be handled by wrapper script)
						juce::String encodedKey = key.replace("%", "%25").replace("&", "%26").replace("=", "%3D").replace("+", "%2B").replace(" ", "%20").replace("\n", "%0A").replace("\r", "%0D");
						juce::String encodedValue = value.replace("%", "%25").replace("&", "%26").replace("=", "%3D").replace("+", "%2B").replace(" ", "%20").replace("\n", "%0A").replace("\r", "%0D");
						juce::String callbackUrl = "sairyne://data_loaded?key=" + encodedKey + "&value=" + encodedValue;
						setName(callbackUrl);
						DBG("handleLoadDataEvent: Loaded data: " + key + " = " + value.substring(0, 50) + "...");
						juce::Logger::writeToLog("handleLoadDataEvent: Loaded data: " + key + " = " + value.substring(0, 50) + "...");
					}
					else
					{
						DBG("handleLoadDataEvent: No data found for key: " + key);
						juce::Logger::writeToLog("handleLoadDataEvent: No data found for key: " + key);
					}
				}
			}
			else
			{
				DBG("handleLoadDataEvent: key is empty!");
				juce::Logger::writeToLog("handleLoadDataEvent: key is empty!");
			}
		}
	};
	auto* browser = new HashReportingWebBrowser(this);
	// Wrapper HTML to remove outer scroll, fill view, and avoid bounce/white edges
    const juce::String siteUrl = "https://sairyne-ai.vercel.app/embed-chat.html";
    const auto wrapper = juce::String(
		"<!DOCTYPE html><html><head>"
		"<meta charset='utf-8'/>"
		"<meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover'/>"
		"<style>"
		"html,body{height:100%;margin:0;padding:0;background:#0b0b0f;overflow:hidden;overscroll-behavior:none}"
		"#wrap{position:fixed;inset:0;background:#0b0b0f;overflow:hidden}"
		"iframe{position:absolute;inset:0;width:100vw;height:100vh;border:0;background:#0b0b0f;overflow:hidden}"
        "</style></head><body>"
        "<div id='wrap'><iframe id='sairyne_iframe' src='" + siteUrl + "' sandbox='allow-scripts allow-same-origin allow-forms allow-popups'></iframe></div>"
        "<script>"
        "(function(){"
        " try { location.href = 'sairyne://msg=script-start'; } catch(_){ }"
        " setTimeout(function(){"
		"   try { window.postMessage('wrapper-self-test','*'); } catch(_){ location.href='sairyne://msg=self-test-error'; }"
        " }, 1000);"
		" // Smoke-test: generate JUCE-visible markers + attempt a save, so we can confirm wrapper->C++ wiring"
		" setTimeout(function(){"
		"   try { location.href = 'juce://debug?message=wrapper_smoke_debug'; } catch(e) {}"
		" }, 1200);"
		" setTimeout(function(){"
		"   try {"
		"     if (window.__JUCE__ && window.__JUCE__.backend && typeof window.__JUCE__.backend.emitEvent === 'function') {"
		"       window.__JUCE__.backend.emitEvent('saveData', { key: 'sairyne_smoke_test', value: 'ok' });"
		"       console.log('[Wrapper] ✅ Smoke saveData emitted');"
		"     }"
		"   } catch(e) { console.error('[Wrapper] ❌ Smoke saveData failed:', e); }"
		" }, 1400);"
		" setTimeout(function(){"
		"   try { location.href = 'juce://save?key=sairyne_smoke_test&value=ok'; } catch(e) {}"
		" }, 1600);"
		" function reportFlag(flag){"
		"   try { location.href = 'sairyne://expanded=' + flag; } catch(_){ }"
		"   try { if (window.__JUCE__ && window.__JUCE__.backend && typeof window.__JUCE__.backend.emitEvent === 'function') {"
		"     window.__JUCE__.backend.emitEvent('sairyneResize', { expanded: flag === '1', value: flag });"
		"   } } catch(_){ }"
		"   try { location.hash = '#expanded=' + flag; } catch(_){ }"
		" }"
		" // Handle data_loaded callback from JUCE"
		" function handleDataLoaded(key, value) {"
		"   try {"
		"     if (window.onJuceDataLoaded && typeof window.onJuceDataLoaded === 'function') {"
		"       window.onJuceDataLoaded(key, value);"
		"     }"
		"   } catch(err) {"
		"     console.error('[Wrapper] Error in onJuceDataLoaded:', err);"
		"   }"
		" }"
		" window.addEventListener('message', function(e){"
        "   var payload = e.data;"
		"   console.log('[Wrapper] 📨 Message event received, payload type:', typeof payload);"
		"   console.log('[Wrapper] 📨 Payload:', payload ? JSON.stringify(payload).substring(0, 300) : 'null');"
		"   try {"
		"     // Handle JUCE_DATA messages from iframe (new postMessage-based system)"
		"     if (payload && typeof payload === 'object' && payload.type === 'JUCE_DATA') {"
		"       var command = payload.command;"
		"       var data = payload.payload;"
		"       console.log('[Wrapper] 📥 Received JUCE_DATA:', command, data ? JSON.stringify(data).substring(0, 200) : 'no payload');"
		"       "
		"       // Handle save_data command"
		"       if (command === 'save_data' && data && data.key && data.value) {"
		"         console.log('[Wrapper] 💾 Processing save_data for key:', data.key, 'value length:', data.value.length);"
		"         try {"
		"           if (window.__JUCE__ && window.__JUCE__.backend && typeof window.__JUCE__.backend.emitEvent === 'function') {"
		"             window.__JUCE__.backend.emitEvent('saveData', { key: data.key, value: data.value });"
		"             console.log('[Wrapper] ✅ emitEvent(saveData) sent');"
		"             return;"
		"           }"
		"         } catch(err) { console.error('[Wrapper] ❌ emitEvent(saveData) failed:', err); }"
		"         var url = 'juce://save?key=' + encodeURIComponent(data.key) + '&value=' + encodeURIComponent(data.value);"
		"         console.log('[Wrapper] 📤 Fallback: location.href juce://save, URL length:', url.length);"
		"         location.href = url;"
		"         return;"
		"       }"
		"       "
		"       // Handle load_data command"
		"       if (command === 'load_data' && data && data.key) {"
		"         console.log('[Wrapper] 📥 Processing load_data for key:', data.key);"
		"         try {"
		"           if (window.__JUCE__ && window.__JUCE__.backend && typeof window.__JUCE__.backend.emitEvent === 'function') {"
		"             window.__JUCE__.backend.emitEvent('loadData', { key: data.key });"
		"             console.log('[Wrapper] ✅ emitEvent(loadData) sent');"
		"             return;"
		"           }"
		"         } catch(err) { console.error('[Wrapper] ❌ emitEvent(loadData) failed:', err); }"
		"         var url = 'juce://load?key=' + encodeURIComponent(data.key);"
		"         console.log('[Wrapper] 📤 Fallback: location.href juce://load');"
		"         location.href = url;"
		"         return;"
		"       }"
		"       "
		"       // Handle open_url command"
		"       if (command === 'open_url' && data && data.url) {"
		"         console.log('[Wrapper] 🌐 Processing open_url:', data.url);"
		"         try {"
		"           if (window.__JUCE__ && window.__JUCE__.backend && typeof window.__JUCE__.backend.emitEvent === 'function') {"
		"             window.__JUCE__.backend.emitEvent('openUrl', { url: data.url });"
		"             console.log('[Wrapper] ✅ emitEvent(openUrl) sent');"
		"             return;"
		"           }"
		"         } catch(err) { console.error('[Wrapper] ❌ emitEvent(openUrl) failed:', err); }"
		"         var url = 'juce://open_url?url=' + encodeURIComponent(data.url);"
		"         location.href = url;"
		"         return;"
		"       }"
		"       "
		"       console.log('[Wrapper] ⚠️ Unknown JUCE_DATA command:', command);"
		"       return;"
		"     }"
		"     "
		"     // Legacy: Handle save_data messages from iframe (direct postMessage from frontend)"
		"     if (payload && typeof payload === 'object' && payload.type === 'save_data' && payload.payload && payload.payload.key && payload.payload.value) {"
		"       var key = payload.payload.key;"
		"       var value = payload.payload.value;"
		"       console.log('[Wrapper] 💾 Legacy save_data received, key:', key, 'value length:', value.length);"
		"       var url = 'juce://save?key=' + encodeURIComponent(key) + '&value=' + encodeURIComponent(value);"
		"       location.href = url;"
		"       return;"
		"     }"
		"     "
		"     // Legacy: Handle load_data messages from iframe"
		"     if (payload && typeof payload === 'object' && payload.type === 'load_data' && payload.payload && payload.payload.key) {"
		"       var key = payload.payload.key;"
		"       console.log('[Wrapper] 📥 Legacy load_data received, key:', key);"
		"       var url = 'juce://load?key=' + encodeURIComponent(key);"
		"       location.href = url;"
		"       return;"
		"     }"
		"     "
		"     // Log other messages for debugging"
		"     if (payload && typeof payload === 'object') {"
		"       var msgType = payload.type || 'unknown';"
		"       console.log('[Wrapper] 📨 Received message type:', msgType);"
		"     }"
		"   } catch(err) {"
		"     console.error('[Wrapper] ❌ Error handling message:', err);"
		"     console.error('[Wrapper] ❌ Error details:', err.message || 'unknown');"
		"   }"
        "   try {"
        "     var summary = typeof payload === 'string' ? payload.substring(0, 60) : JSON.stringify(payload).substring(0, 60);"
        "     location.href = 'sairyne://msg=' + encodeURIComponent(summary);"
        "   } catch(_){ location.href = 'sairyne://msg=err'; }"
		"   try {"
		"     if (payload && payload.source === 'sairyne' && typeof payload.expanded !== 'undefined') {"
		"        var flag = payload.expanded ? '1' : '0';"
		"        reportFlag(flag);"
		"        return;"
		"     }"
		"   } catch(_){ }"
		"   // Handle OPEN_URL messages from juceBridge"
		"   try {"
		"     if (typeof payload === 'string') {"
		"       var parsed = JSON.parse(payload);"
		"       if (parsed && parsed.type === 'open_url' && parsed.payload && parsed.payload.url) {"
		"         location.href = 'sairyne://open_url?url=' + encodeURIComponent(parsed.payload.url);"
		"         return;"
		"       }"
		"     }"
		"     // Also check if payload is already an object"
		"     if (payload && typeof payload === 'object' && payload.type === 'open_url' && payload.payload && payload.payload.url) {"
		"       location.href = 'sairyne://open_url?url=' + encodeURIComponent(payload.payload.url);"
		"       return;"
		"     }"
		"   } catch(_){ }"
		"   if(typeof payload==='string' && payload.indexOf('sairyne:resize:')===0){"
        "     var v=payload.split(':').pop();"
        "     var flag = (v==='1'?'1':'0');"
        "     reportFlag(flag);"
        "   }"
		" });"
		" // Monitor for data_loaded via pageAboutToLoad"
		" // When JUCE calls setName() with sairyne://data_loaded, it triggers pageAboutToLoad"
		" // We'll intercept this and send to iframe via postMessage"
		" var lastDataLoadedUrl = '';"
		" function checkForDataLoaded() {"
		"   try {"
		"     // Check if current URL contains data_loaded (setName triggers pageAboutToLoad)"
		"     var currentUrl = window.location.href || '';"
		"     if (currentUrl !== lastDataLoadedUrl && currentUrl.indexOf('sairyne://data_loaded') >= 0) {"
		"       lastDataLoadedUrl = currentUrl;"
		"       var urlParts = currentUrl.split('?');"
		"       if (urlParts.length > 1) {"
		"         var params = urlParts[1];"
		"         var keyMatch = params.match(/key=([^&]+)/);"
		"         var valueMatch = params.match(/value=(.+)$/);"
		"         if (keyMatch && valueMatch) {"
		"           var key = decodeURIComponent(keyMatch[1]);"
		"           var value = decodeURIComponent(valueMatch[1]);"
		"           // Send to iframe"
		"           var iframe = document.getElementById('sairyne_iframe');"
		"           if (iframe && iframe.contentWindow) {"
		"             iframe.contentWindow.postMessage({ type: 'juce_data_loaded', key: key, value: value }, '*');"
		"           }"
		"         }"
		"       }"
		"     }"
		"   } catch(err) {"
		"     console.error('[Wrapper] Error checking data_loaded:', err);"
		"   }"
		" }"
		" // Check periodically (pageAboutToLoad may not trigger location.href change)"
		" setInterval(checkForDataLoaded, 100);"
		" // Also listen for postMessage from JUCE (if sent directly)"
		" window.addEventListener('message', function(e) {"
		"   try {"
		"     if (e.data && e.data.type === 'juce_data_loaded') {"
		"       var key = e.data.key || '';"
		"       var value = e.data.value || '';"
		"       if (key && value) {"
		"         // Forward to iframe"
		"         var iframe = document.getElementById('sairyne_iframe');"
		"         if (iframe && iframe.contentWindow) {"
		"           iframe.contentWindow.postMessage({ type: 'juce_data_loaded', key: key, value: value }, '*');"
		"         }"
		"       }"
		"     }"
		"   } catch(err) {"
		"     console.error('[Wrapper] Error handling juce_data_loaded:', err);"
		"   }"
		" });"
        " var f = document.getElementById('sairyne_iframe');"
        " if(!f) return;"
        " f.addEventListener('load', function(){"
        "  try{"
        "    var d = f.contentDocument || f.contentWindow.document;"
        "    if(!d) return;"
        "    var s = d.createElement('style');"
        "    s.textContent = "
        "      'html,body{margin:0!important;padding:0!important;overflow:hidden!important;background:#0b0b0f!important;}'"
        "    + '*, *::before, *::after{-webkit-tap-highlight-color:transparent;}'"
        "    + '#app, [data-root], [data-app]{margin:0!important;padding:0!important;width:100vw!important;height:100vh!important;max-width:100vw!important;overflow:hidden!important;}'"
        "    + '.chat-container,[data-chat-container]{width:100vw!important;height:100vh!important;max-width:100vw!important;overflow:auto!important;-webkit-overflow-scrolling:touch;}'"
        "    + '.container, .wrapper, .frame{margin:0!important;padding:0!important;max-width:100vw!important;}'"
        "    + '.card, .panel{margin:0!important;}'"
        "    ;"
        "    d.head.appendChild(s);"
        "    // Observe Visual Tips presence to toggle expansion automatically"
        "    var last = null;"
        "    function scanState(){"
        "      try{"
        "        return !!d.querySelector('.visual-tips-window-new, [data-visual-tips], .VisualTips, .visual-tips');"
        "      }catch(e){"
        "        return false;"
        "      }"
        "    }"
        "    function emitIfChanged(){"
        "      var expanded = scanState();"
        "      if(expanded !== last){"
        "        last = expanded;"
        "        reportFlag(expanded ? '1' : '0');"
        "      }"
        "    }"
        "    emitIfChanged();"
        "    if (typeof MutationObserver !== 'undefined'){"
        "      var observer = new MutationObserver(function(){ emitIfChanged(); });"
        "      observer.observe(d.body || d.documentElement, { childList: true, subtree: true, attributes: true });"
        "    } else {"
        "      setInterval(emitIfChanged, 800);"
        "    }"
        "  }catch(e){}"
        " });"
        "})();"
        "</script>"
		"</body></html>");
	// Use base64 data URL to avoid percent-encoded artifacts displaying as text
	const char* utf8 = wrapper.toRawUTF8();
	juce::String b64 = juce::Base64::toBase64(utf8, (size_t) wrapper.getNumBytesAsUTF8());
	browser->setName("data:text/html"); // initial
	try
	{
		browser->goToURL("data:text/html;charset=utf-8;base64," + b64);
	}
	catch (const std::exception& ex)
	{
		juce::Logger::writeToLog("WebView goToURL exception: " + juce::String(ex.what()));
	}
	catch (...)
	{
		juce::Logger::writeToLog("WebView goToURL exception: unknown");
	}
	return std::unique_ptr<juce::Component>(browser);
#else
	jassertfalse; return {};
#endif
}

// ========= Обязательная фабрика JUCE =========
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
	DBG("createPluginFilter(): constructing processor");
	return new SairyneAudioProcessor();
}
