import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type ExploreStackParamList = {
  Map: undefined;
  List: undefined;
  Detail: { id: string };
  Report: { id: string };
  SuggestEdit: { id: string };
};

export type AddStackParamList = {
  AuthGate: undefined;
  AddRestroom: undefined;
  Confirm: { mode: 'add' | 'report' | 'edit' };
};

export type RouteStackParamList = {
  RoutePlanner: undefined;
  Detail: { id: string };
};

export type TabParamList = {
  Explore: NavigatorScreenParams<ExploreStackParamList>;
  Add: NavigatorScreenParams<AddStackParamList>;
  Route: NavigatorScreenParams<RouteStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
  Profile: undefined;
  Settings: undefined;
};
