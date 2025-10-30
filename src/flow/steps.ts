export type Step =
  | "SignIn"
  | "Welcome"
  | "CreateYourFirstProject"
  | "ChooseYourProject"
  | "StartChat1"
  | "Chat2"
  | "Chat3"
  | "Chat4"
  | "Chat5"
  | "Chat5.1"
  | "Chat6Tips"
  | "Chat7Tips2"
  | "Chat8";

export const NEXT: Record<Step, Step | null> = {
  SignIn: "Welcome",
  Welcome: "CreateYourFirstProject",
  CreateYourFirstProject: "ChooseYourProject",
  ChooseYourProject: "StartChat1",
  StartChat1: "Chat2",
  Chat2: "Chat3",
  Chat3: "Chat4",
  Chat4: "Chat5",
  Chat5: "Chat6Tips", // Default next from Chat5
  "Chat5.1": "Chat5", // Back from Chat5.1 goes to Chat5
  Chat6Tips: "Chat7Tips2",
  Chat7Tips2: "Chat8",
  Chat8: null
};

// Image sources for each step - using individual workflow images
export const STEP_IMAGES: Record<Step, string> = {
  SignIn: "/src/screens/Workflow/SignIn.png",
  Welcome: "/src/screens/Workflow/WelcomeToSairyne.png",
  CreateYourFirstProject: "/src/screens/Workflow/CreateYourFirstProject.png",
  ChooseYourProject: "/src/screens/Workflow/ChooseYourProject.png",
  StartChat1: "/src/screens/Workflow/StartChat1.png",
  Chat2: "/src/screens/Workflow/Chat2.png",
  Chat3: "/src/screens/Workflow/Chat3.png",
  Chat4: "/src/screens/Workflow/Chat4.png",
  Chat5: "/src/screens/Workflow/Chat5.png",
  "Chat5.1": "/src/screens/Workflow/Chat5.1.png",
  Chat6Tips: "/src/screens/Workflow/Chat6Tips.png",
  Chat7Tips2: "/src/screens/Workflow/Chat7Tips2.png",
  Chat8: "/src/screens/Workflow/Chat8.png"
};
