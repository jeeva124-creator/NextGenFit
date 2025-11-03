import Replicate from "replicate";

// Export a safe accessor so the app can run without the token (image gen disabled)
export const getReplicate = (): Replicate | null => {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;
  return new Replicate({ auth: token });
};

