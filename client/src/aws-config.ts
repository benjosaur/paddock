import { ResourcesConfig } from "aws-amplify";

const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId:
        import.meta.env.VITE_COGNITO_USER_POOL_ID || "eu-west-2_hl5RivxJ3",
      userPoolClientId:
        import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID ||
        "49lmaak5qm13k76tu38p58pgp4",
      loginWith: {
        oauth: {
          domain: "auth.paddock.health",
          scopes: ["email", "openid", "profile"],
          redirectSignIn: [`${window.location.origin}/`],
          redirectSignOut: [`${window.location.origin}/`],
          responseType: "code",
        },
        email: true,
        username: false,
      },
    },
  },
};
export default amplifyConfig;
