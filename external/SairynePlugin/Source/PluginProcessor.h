#pragma once
#include <JuceHeader.h>
#include <memory>
#include <atomic>

class SairyneAudioProcessor : public juce::AudioProcessor
{
public:
    SairyneAudioProcessor();
    ~SairyneAudioProcessor() override;

    //=== JUCE обязательные функции ===//
    void prepareToPlay (double sampleRate, int samplesPerBlock) override {}
    void releaseResources() override {}
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override {}

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "Sairyne"; }
    bool acceptsMidi() const override { return false; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock&) override {}
    void setStateInformation (const void*, int) override {}

    // WebView factory (decouples editor from implementation)
    std::unique_ptr<juce::Component> createWebViewComponent();

    // Soft guard overlay API
    bool shouldShowMasterOverlay() const { return masterOverlay; }
    void dismissMasterOverlayForThisSession() { masterOverlay = false; }
    
    // PropertiesFile access (for storage)
    juce::PropertiesFile* getPropertiesFile();

private:
    // One-instance (soft) and overlay flag
    static std::atomic<int> liveInstances;
    bool masterOverlay = true;
    std::unique_ptr<juce::FileLogger> fileLogger;
    
    // PropertiesFile for persistent storage (fallback if localStorage doesn't work)
    std::unique_ptr<juce::PropertiesFile> propertiesFile;
};