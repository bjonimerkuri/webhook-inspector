export interface CapturedRequest {
  id: string;
  receivedAt: string;
  method: string;
  path: string;
  query: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  body: string;
  ip: string;
  size: number;
}
