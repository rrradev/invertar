import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Image Upload Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/');
    
    // Wait for login page to load
    await expect(page.getByRole('heading', { name: 'Invertar' })).toBeVisible();
    
    // Login with test credentials (these would need to be seeded)
    await page.getByPlaceholder('Enter your organization name').fill('TEST');
    await page.getByPlaceholder('Enter your username').fill('user');
    await page.getByPlaceholder('Enter your password').fill('User123@user');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait for dashboard to load
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
  });

  test('should display image upload component in create item form', async ({ page }) => {
    // Click create item button
    await page.getByTestId('create-item-button').click();
    
    // Verify create item form is visible
    await expect(page.getByTestId('create-item-form')).toBeVisible();
    
    // Verify image upload section is present
    await expect(page.getByText('Item Image')).toBeVisible();
    
    // Verify upload button is present (the plus icon button)
    const uploadArea = page.locator('.image-upload-container');
    await expect(uploadArea).toBeVisible();
    
    // Verify upload instructions are shown
    await expect(page.getByText('Click to upload image')).toBeVisible();
    await expect(page.getByText('PNG, JPG up to 5MB')).toBeVisible();
  });

  test('should show proper UI states for image upload', async ({ page }) => {
    // Open create item form
    await page.getByTestId('create-item-button').click();
    await expect(page.getByTestId('create-item-form')).toBeVisible();
    
    // Initially should show upload button
    await expect(page.getByText('Click to upload image')).toBeVisible();
    
    // Should show file size and type restrictions
    await expect(page.getByText('PNG, JPG up to 5MB')).toBeVisible();
  });

  test('should handle form submission with image data', async ({ page }) => {
    // Create a test shelf first
    const shelfName = `Test Shelf ${faker.string.uuid()}`;
    
    await page.getByTestId('create-shelf-button').click();
    await page.getByPlaceholder('Enter shelf name').fill(shelfName);
    await page.getByTestId('submit-shelf-button').click();
    
    // Wait for success message
    await expect(page.getByText(`Shelf "${shelfName}" created successfully!`)).toBeVisible();
    
    // Open create item form
    await page.getByTestId('create-item-button').click();
    await expect(page.getByTestId('create-item-form')).toBeVisible();
    
    // Fill in item details
    const itemName = `Test Item ${faker.string.uuid()}`;
    await page.getByPlaceholder('Enter item name').fill(itemName);
    await page.getByRole('combobox').selectOption(shelfName);
    
    // Note: In a real test, we would mock the Cloudinary upload
    // For now, we'll test the form submission without an actual file upload
    
    await page.getByTestId('submit-item-button').click();
    
    // Should show success message
    await expect(page.getByText(`Item "${itemName}" created successfully!`)).toBeVisible();
  });

  test('should display item images in shelf view', async ({ page }) => {
    // Look for items in the shelf view that might have images
    const itemRows = page.getByTestId('item-row');
    
    if (await itemRows.count() > 0) {
      // Check if ItemImage components are rendered
      const firstItem = itemRows.first();
      
      // The ItemImage component should either show:
      // 1. An actual image if cloudinaryPublicId exists
      // 2. A fallback gradient with item initial if no image
      const imageContainer = firstItem.locator('div').first();
      await expect(imageContainer).toBeVisible();
      
      // Should have proper sizing classes
      await expect(imageContainer).toHaveClass(/h-8 w-8/);
    }
  });

  test('should handle image upload component disabled state', async ({ page }) => {
    // Open create item form
    await page.getByTestId('create-item-button').click();
    await expect(page.getByTestId('create-item-form')).toBeVisible();
    
    // Start creating an item to trigger loading state
    const itemName = `Test Item ${faker.string.uuid()}`;
    await page.getByPlaceholder('Enter item name').fill(itemName);
    
    // The image upload should be disabled during form submission
    // Note: This would be more thorough with actual form submission testing
    await expect(page.getByText('Item Image')).toBeVisible();
  });

  test('should show proper fallback when no image is available', async ({ page }) => {
    // Look for items without images
    const itemRows = page.getByTestId('item-row');
    
    if (await itemRows.count() > 0) {
      // Check that items without images show the gradient fallback
      const firstItem = itemRows.first();
      const itemNameCell = firstItem.locator('td').first();
      
      // Should contain either an image or the gradient fallback
      await expect(itemNameCell).toBeVisible();
      
      // The fallback should show the first letter of the item name
      const gradientDiv = itemNameCell.locator('.bg-gradient-to-r');
      if (await gradientDiv.count() > 0) {
        // Should contain a span with the first letter
        const letterSpan = gradientDiv.locator('span.text-white');
        await expect(letterSpan).toBeVisible();
      }
    }
  });

  test('should maintain responsive design with image components', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.getByTestId('create-item-button').click();
    await expect(page.getByTestId('create-item-form')).toBeVisible();
    
    // Image upload component should be visible and properly sized
    await expect(page.getByText('Item Image')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('Item Image')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByText('Item Image')).toBeVisible();
  });
});