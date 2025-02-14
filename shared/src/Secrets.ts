import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { GameEnv } from "./Utils";

export const secretManager = new SecretManagerServiceClient();

export async function getSecret(secretName: string, ge: GameEnv) {
  if (ge == GameEnv.Dev) {
    console.log(`loading secret ${secretName} from environment variable`);
    return process.env[secretName]; // This is how you access env vars dynamically
  }
  console.log(`loading secret ${secretName} from Google secrets manager`);
  const name = `projects/openfrontio/secrets/${secretName}/versions/latest`;
  const [version] = await secretManager.accessSecretVersion({ name });
  return version.payload?.data?.toString();
}
