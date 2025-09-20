// import type { JWTPayload } from '@repo/types/auth/jwt';

declare global {
	interface Window {
		__hideInitialLoading?: () => void;
	}
}

// declare global {
// 	namespace App {
// 		interface Locals {
// 			user: JWTPayload | null;
// 			shouldRequestNewTokens: boolean;
// 		}

// 		interface PageData {
// 			user: Locals['user'];
// 			hasRefreshToken: Locals['shouldRequestNewTokens'];
// 		}
// 	}
// }

export {};
