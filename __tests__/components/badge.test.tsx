import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, badgeVariants } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders children correctly", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    render(<Badge data-testid="badge">Default</Badge>);
    const badge = screen.getByTestId("badge");

    expect(badge.className).toContain("bg-primary");
    expect(badge.className).toContain("text-primary-foreground");
  });

  it("applies secondary variant classes", () => {
    render(
      <Badge variant="secondary" data-testid="badge">
        Secondary
      </Badge>
    );
    const badge = screen.getByTestId("badge");

    expect(badge.className).toContain("bg-secondary");
    expect(badge.className).toContain("text-secondary-foreground");
  });

  it("applies destructive variant classes", () => {
    render(
      <Badge variant="destructive" data-testid="badge">
        Error
      </Badge>
    );
    const badge = screen.getByTestId("badge");

    expect(badge.className).toContain("bg-destructive");
    expect(badge.className).toContain("text-destructive-foreground");
  });

  it("applies outline variant classes", () => {
    render(
      <Badge variant="outline" data-testid="badge">
        Outline
      </Badge>
    );
    const badge = screen.getByTestId("badge");

    expect(badge.className).toContain("text-foreground");
    // Outline should not have bg-primary
    expect(badge.className).not.toContain("bg-primary");
  });

  it("merges custom classNames", () => {
    render(
      <Badge className="custom-badge" data-testid="badge">
        Custom
      </Badge>
    );
    const badge = screen.getByTestId("badge");

    expect(badge.className).toContain("custom-badge");
    // Should still have base classes
    expect(badge.className).toContain("inline-flex");
  });

  it("passes through HTML attributes", () => {
    render(
      <Badge role="status" aria-label="Status badge">
        Active
      </Badge>
    );

    const badge = screen.getByRole("status");
    expect(badge).toHaveAttribute("aria-label", "Status badge");
  });

  it("has correct base styling classes", () => {
    render(<Badge data-testid="badge">Base</Badge>);
    const badge = screen.getByTestId("badge");

    expect(badge.className).toContain("inline-flex");
    expect(badge.className).toContain("items-center");
    expect(badge.className).toContain("rounded-md");
    expect(badge.className).toContain("border");
    expect(badge.className).toContain("text-xs");
    expect(badge.className).toContain("font-semibold");
  });

  it("badgeVariants helper returns correct classes", () => {
    const defaultClasses = badgeVariants();
    expect(defaultClasses).toContain("bg-primary");

    const secondaryClasses = badgeVariants({ variant: "secondary" });
    expect(secondaryClasses).toContain("bg-secondary");

    const destructiveClasses = badgeVariants({ variant: "destructive" });
    expect(destructiveClasses).toContain("bg-destructive");

    const outlineClasses = badgeVariants({ variant: "outline" });
    expect(outlineClasses).toContain("text-foreground");
  });
});
