import axios, { AxiosError } from "axios";
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const { VITE_API_BASE_URL } = import.meta.env;

// Interfaces
interface RefreshTokenResponse {
  accessToken: string;
}

interface QueuedRequest {
  resolve: (token?: string | null) => void;
  reject: (error: any) => void;
}

interface ErrorResponse {
  message: string;
}

// Create axios instance
const instance: AxiosInstance = axios.create({
  baseURL: VITE_API_BASE_URL,
  withCredentials: true,
});

// Configure constants
const CSRF_ENDPOINT = "/api/auth/csrf-token";
const REFRESH_ENDPOINT = "/api/auth/refresh";
const LOGIN_ENDPOINT = "/api/auth/login";

const CSRF_HEADER = "X-XSRF-TOKEN";
const JWT_HEADER = "Authorization";

// Token management state
let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

// Process queued requests after token refresh
const processQueue = (error: any, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const needsCsrf = (config: AxiosRequestConfig): boolean => {
  return !/^(GET|HEAD|OPTIONS|TRACE)$/i.test(config.method || "");
};

const isPublicPage = (): boolean => {
  const publicUrls = ["/login", "/register", "/user/activate"];
  return publicUrls.some((url) => window.location?.pathname?.startsWith(url));
};

const getCsrfTokenFromCookie = (): string | undefined => {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];
};

const attachCsrf = async (
  config: InternalAxiosRequestConfig
): Promise<void> => {
  let csrfToken = getCsrfTokenFromCookie();

  // If CSRF token is missing, try to fetch it
  if (!csrfToken && config.url !== CSRF_ENDPOINT) {
    try {
      await axios.get(`${VITE_API_BASE_URL}${CSRF_ENDPOINT}`, {
        withCredentials: true,
      });
      csrfToken = getCsrfTokenFromCookie();
    } catch (err) {
      // If token fetch fails, the request will fail anyway, so just leave it
    }
  }

  if (csrfToken && config.headers) {
    config.headers[CSRF_HEADER] = csrfToken;
  }
};

export const setupAxiosInterceptors = (
  goToLogin: () => void,
  logout: () => void,
  getAccessToken: () => string | null,
  setAccessToken: (token: string | null) => void
): void => {
  // Request interceptor for CSRF and access tokens
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      if (needsCsrf(config)) {
        await attachCsrf(config);
      }

      const accessToken = getAccessToken();
      if (accessToken && config.headers) {
        config.headers[JWT_HEADER] = `Bearer ${accessToken}`;
      }

      return config;
    },
    (error: any) => Promise.reject(error)
  );

  // Response interceptor for handling 401s and token refresh
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ErrorResponse>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _csrfRetry?: boolean;
      };

      if (!error.response) {
        return Promise.reject(error);
      }

      if (
        error.response.status === 401 &&
        !originalRequest?._retry &&
        originalRequest?.url !== LOGIN_ENDPOINT &&
        originalRequest?.url !== REFRESH_ENDPOINT
      ) {
        if (isRefreshing) {
          return new Promise<string | null>((resolve, reject) => {
            failedQueue.push({
              resolve: (token?: string | null) => resolve(token || null),
              reject,
            });
          })
            .then(() => {
              return instance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { data }: AxiosResponse<RefreshTokenResponse> =
            await instance.post(REFRESH_ENDPOINT);

          processQueue(null, data.accessToken);
          setAccessToken(data.accessToken);

          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);

          logout();

          if (!isPublicPage()) {
            goToLogin();
          }

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Handle CSRF errors (403)
      if (
        error.response.status === 403 &&
        error.response.data &&
        typeof error.response.data === "object" &&
        error.response.data.message &&
        error.response.data.message.includes("CSRF") &&
        !originalRequest?._csrfRetry
      ) {
        originalRequest._csrfRetry = true;

        if (needsCsrf(originalRequest)) {
          try {
            await axios.get(`${VITE_API_BASE_URL}${CSRF_ENDPOINT}`, {
              withCredentials: true,
            });

            const refreshedToken = getCsrfTokenFromCookie();

            if (refreshedToken && originalRequest.headers) {
              originalRequest.headers[CSRF_HEADER] =
                decodeURIComponent(refreshedToken);
              return instance(originalRequest);
            }
          } catch (csrfError) {
            // Silent fail
          }
        }
      }

      return Promise.reject(error);
    }
  );
};

export default instance;
