import { isAxiosError } from "axios";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public override cause?: unknown,
  ) {
    super(message);
  }

  protected static parseAxiosError(
    err: unknown,
    fallbackMessage: string,
  ): { message: string; status?: number } {
    if (isAxiosError(err)) {
      const status = err.response?.status;
      const data = err.response?.data as
        | {
            error_description?: string;
            error?: string;
            message?: string;
          }
        | undefined;
      const message =
        data?.error_description ??
        data?.error ??
        data?.message ??
        err.message ??
        fallbackMessage;
      return { message, status };
    }
    return { message: fallbackMessage };
  }

  static fromUnknown(
    err: unknown,
    fallbackMessage: string,
    status?: number,
  ): ApiError {
    if (err instanceof ApiError) return err;

    if (isAxiosError(err)) {
      const { message, status: axiosStatus } = this.parseAxiosError(
        err,
        fallbackMessage,
      );
      return new ApiError(message, status || axiosStatus, err);
    }

    if (err instanceof Error) {
      return new ApiError(err.message, status, err);
    }

    return new ApiError(fallbackMessage, status, err);
  }
}
