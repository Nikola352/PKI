export interface ErrorResponse {
  code: number;
  message: string;
  errors: { [key: string]: string };
}
