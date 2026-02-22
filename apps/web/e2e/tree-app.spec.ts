import { expect, test } from "@playwright/test";

test.describe("Bloodline Next app /tree", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tree");
  });

  test("loads fixture dataset and shows root node + details panel", async ({ page }) => {
    await expect(page.getByTestId("dataset-status")).toContainText("House Atlas");
    await expect(page.getByTestId("node-p_root")).toBeVisible();
    await expect(page.getByLabel("Royal Details Panel")).toBeVisible();
    await expect(page.getByTestId("details-person-name")).toHaveText("Rakesh I");

    await expect(page.locator('section[aria-label="Tree workspace"]')).toHaveScreenshot("app-tree-initial.png");
  });

  test("clicking a node updates details and highlights relatives", async ({ page }) => {
    await page.getByTestId("node-p_child1").click();

    await expect(page.getByTestId("details-person-name")).toHaveText("Aarav");
    await expect(page.getByTestId("node-p_root")).toHaveClass(/nodeHighlight/);
    await expect(page.getByTestId("node-p_grand")).toHaveClass(/nodeHighlight/);

    await expect(page.locator("body")).toHaveScreenshot("app-tree-selected-child1.png", {
      maxDiffPixelRatio: 0.02
    });
  });

  test("search and filters dim non-matching nodes", async ({ page }) => {
    await page.getByPlaceholder("Search by name...").fill("a");
    await page.getByLabel("Filter by branch").selectOption("Main Branch");
    await page.getByLabel("Filter by living status").selectOption("living");

    await expect(page.getByTestId("node-p_root")).toHaveClass(/nodeDimmed/);
    await expect(page.getByTestId("node-p_child1")).not.toHaveClass(/nodeDimmed/);
    await expect(page.getByTestId("node-p_child2")).toHaveClass(/nodeDimmed/);

    await expect(page.locator('section[aria-label="Tree workspace"]')).toHaveScreenshot("app-tree-filters.png");
  });

  test("search result selection recenters viewport and updates details", async ({ page }) => {
    const before = await page.getByTestId("viewport-readout").textContent();

    await page.getByPlaceholder("Search by name...").fill("nila");
    await expect(page.getByTestId("search-result-p_grand")).toBeVisible();
    await page.getByTestId("search-result-p_grand").click();

    await expect(page.getByTestId("details-person-name")).toHaveText("Nila");
    const after = await page.getByTestId("viewport-readout").textContent();
    expect(after).not.toBe(before);
  });

  test("pan and zoom change viewport state", async ({ page }) => {
    const stage = page.getByTestId("tree-stage");
    const before = await page.getByTestId("viewport-readout").textContent();

    await stage.dragTo(stage, {
      sourcePosition: { x: 300, y: 240 },
      targetPosition: { x: 430, y: 320 }
    });
    await stage.hover({ position: { x: 320, y: 260 } });
    await page.mouse.wheel(0, -200);

    const after = await page.getByTestId("viewport-readout").textContent();
    expect(after).not.toBe(before);
  });

  test("invalid dataset flow shows validation panel", async ({ page }) => {
    await page.getByRole("button", { name: "Load Invalid" }).click();

    await expect(page.getByTestId("dataset-status")).toContainText("Invalid dataset");
    await expect(page.getByTestId("error-panel")).toBeVisible();
    await expect(page.getByTestId("error-list").locator("li")).toHaveCount(1);
    await expect(page.locator('section[aria-label="Tree workspace"]')).toHaveScreenshot("app-tree-invalid.png");
  });

  test("loads british royal family example dataset", async ({ page }) => {
    await page.getByRole("button", { name: "Load British Example" }).click();

    await expect(page.getByTestId("dataset-status")).toContainText("British Royal Family (Example)");
    await expect(page.getByTestId("node-p_queen_elizabeth_ii")).toBeVisible();
    await expect(page.getByTestId("details-person-name")).toHaveText("Queen Elizabeth II");
  });
});
