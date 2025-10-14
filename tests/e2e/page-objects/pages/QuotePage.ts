import { Page, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';

/**
 * Page object for quote management functionality
 */
export class QuotePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * BUILDING BLOCK: Creates a new quote from within the Request Detail modal.
   * @param quoteDetails.description The description for the first labor item.
   * @param quoteDetails.price The price for the first labor item.
   */
  async createQuote({ description, price }: { description: string, price: string }): Promise<void> {
    console.log(`Creating quote with description: "${description}"`);

    const addNewQuoteButton = this.page.getByRole('button', { name: 'Add New Quote' });
    await addNewQuoteButton.click({ timeout: 10000 });

    const laborSection = this.page.locator('div:has-text("Itemized Labor")');
    await laborSection.getByLabel('Description').fill(description);
    await laborSection.getByLabel('Price').fill(price);

    await this.page.getByRole('button', { name: 'Save Quote' }).click();

    // Verify success by waiting for the quote to appear in the list
    const expectedTotal = (parseFloat(price) * 1.12).toFixed(2); // Price + 12% tax
    await expect(this.page.getByText(new RegExp(`Quote #\\d+ - \\$${expectedTotal}`))).toBeVisible({ timeout: 10000 });
    console.log('✅ Quote created successfully.');
  }

  /**
   * BUILDING BLOCK: Updates an existing quote in the Request Detail modal.
   * @param quoteDetails.quoteId The ID of the quote to update.
   * @param quoteDetails.description The new description for the labor item.
   * @param quoteDetails.price The new price for the labor item.
   */
  async updateQuote({ quoteId, description, price }: { quoteId: string, description: string, price: string }): Promise<void> {
    console.log(`Updating quote ${quoteId} with description: "${description}"`);

    // Find the quote by its ID and click the edit button
    const quoteRow = this.page.locator(`[data-quote-id="${quoteId}"]`);
    await quoteRow.waitFor({ state: 'visible', timeout: 10000 });

    // Click the edit button (assuming it has an edit icon or text)
    const editButton = quoteRow.locator('button').filter({ hasText: /^Edit$/ }).or(
      quoteRow.locator('button:has(svg.lucide-edit)').or(
        quoteRow.locator('button[aria-label*="edit" i]')
      )
    );
    await editButton.click();

    // Update the description and price
    const laborSection = this.page.locator('div:has-text("Itemized Labor")');
    await laborSection.getByLabel('Description').fill(description);
    await laborSection.getByLabel('Price').fill(price);

    // Save the updated quote
    await this.page.getByRole('button', { name: 'Save Quote' }).click();

    // Verify success by waiting for the updated quote to appear
    const expectedTotal = (parseFloat(price) * 1.12).toFixed(2); // Price + 12% tax
    await expect(this.page.getByText(new RegExp(`Quote #${quoteId} - \\$${expectedTotal}`))).toBeVisible({ timeout: 10000 });
    console.log(`✅ Quote ${quoteId} updated successfully.`);
  }

  /**
   * BUILDING BLOCK: Deletes a quote from the Request Detail modal.
   * @param quoteId The ID of the quote to delete.
   */
  async deleteQuote(quoteId: string): Promise<void> {
    console.log(`Deleting quote ${quoteId}...`);

    // Find the quote by its ID
    const quoteRow = this.page.locator(`[data-quote-id="${quoteId}"]`);
    await quoteRow.waitFor({ state: 'visible', timeout: 10000 });

    // Click the delete button (assuming it has a delete icon or text)
    const deleteButton = quoteRow.locator('button').filter({ hasText: /^Delete$/ }).or(
      quoteRow.locator('button:has(svg.lucide-trash)').or(
        quoteRow.locator('button[aria-label*="delete" i]')
      )
    );
    await deleteButton.click();

    // Confirm deletion if there's a confirmation dialog
    const confirmButton = this.page.getByRole('button', { name: /^Delete|Confirm|Yes$/ });
    if (await confirmButton.count() > 0) {
      await confirmButton.click();
    }

    // Verify the quote is no longer visible
    await expect(quoteRow).not.toBeVisible({ timeout: 10000 });
    console.log(`✅ Quote ${quoteId} deleted successfully.`);
  }
}
