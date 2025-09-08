import { jwtDecode } from 'jwt-decode';
import type { JWTPayload } from '@repo/types/auth';
import { user } from '$lib/stores/user';
import { trpc } from '$lib/trpc';

export async function getUserFromAccessToken(): Promise<JWTPayload | null> {
	// This function would need access to the access token
	// Since it's in httpOnly cookies, we can't access it from client side
	// So we need a different approach
	return null;
}

export async function setUserStoreFromProfile() {
	try {
		// We need an endpoint that returns user profile with organization name
		// For now, let's use a placeholder approach
		// In a real implementation, we'd have a profile endpoint
		
		// Placeholder: We'll need to get this data somehow
		// This could be from a TRPC profile endpoint
		return null;
	} catch (error) {
		console.error('Failed to set user store:', error);
		return null;
	}
}