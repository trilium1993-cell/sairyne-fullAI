import { Step } from "./steps";
import { SignIn } from "../screens/SignIn";
import { WelcomeToSairyne } from "../screens/WelcomeToSairyne";
import { CreateYourFirstProject } from "../screens/CreateYourFirstProject";
import { YourProjects } from "../screens/YourProjects";
import { FunctionalChat } from "../components/FunctionalChat";

// Registry that maps each Step to a React component
export const getScreenComponent = (step: Step) => {
  switch (step) {
    case "SignIn":
      return SignIn;
    case "Welcome":
      return WelcomeToSairyne;
    case "CreateYourFirstProject":
      return CreateYourFirstProject;
    case "ChooseYourProject":
      return YourProjects;
    case "StartChat1":
    case "Chat2":
    case "Chat3":
    case "Chat4":
    case "Chat5":
      return FunctionalChat;
    // Add other screens as they are created
    default:
      return FunctionalChat; // Fallback to FunctionalChat
  }
};
