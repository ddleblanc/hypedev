import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button, buttonVariants } from "@/components/ui/button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies default variant classes", () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole("button");

    expect(button.className).toContain("bg-primary");
  });

  it("applies destructive variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button");

    expect(button.className).toContain("bg-destructive");
  });

  it("applies outline variant classes", () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole("button");

    expect(button.className).toContain("border");
  });

  it("applies ghost variant classes", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button");

    expect(button.className).toContain("hover:bg-accent");
  });

  it("applies different size classes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button").className).toContain("h-8");

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button").className).toContain("h-10");

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole("button").className).toContain("w-9");
  });

  it("can be disabled", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    expect(button.className).toContain("disabled:pointer-events-none");
  });

  it("merges custom classNames", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button");

    expect(button.className).toContain("custom-class");
  });

  it("renders as child when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );

    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });

  it("passes through HTML attributes", () => {
    render(
      <Button type="submit" data-testid="submit-btn">
        Submit
      </Button>
    );

    const button = screen.getByTestId("submit-btn");
    expect(button).toHaveAttribute("type", "submit");
  });

  it("buttonVariants helper returns correct classes", () => {
    const defaultClasses = buttonVariants();
    expect(defaultClasses).toContain("bg-primary");

    const destructiveClasses = buttonVariants({ variant: "destructive" });
    expect(destructiveClasses).toContain("bg-destructive");

    const smallClasses = buttonVariants({ size: "sm" });
    expect(smallClasses).toContain("h-8");
  });
});
