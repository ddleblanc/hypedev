import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders correctly", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("handles text input", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Type here" />);

    const input = screen.getByPlaceholderText("Type here");
    await user.type(input, "Hello World");

    expect(input).toHaveValue("Hello World");
  });

  it("handles onChange events", () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });

    expect(handleChange).toHaveBeenCalled();
  });

  it("supports different input types", () => {
    const { rerender } = render(<Input type="text" data-testid="input" />);
    expect(screen.getByTestId("input")).toHaveAttribute("type", "text");

    rerender(<Input type="password" data-testid="input" />);
    expect(screen.getByTestId("input")).toHaveAttribute("type", "password");

    rerender(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId("input")).toHaveAttribute("type", "email");

    rerender(<Input type="number" data-testid="input" />);
    expect(screen.getByTestId("input")).toHaveAttribute("type", "number");
  });

  it("can be disabled", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");

    expect(input).toBeDisabled();
    expect(input.className).toContain("disabled:cursor-not-allowed");
    expect(input.className).toContain("disabled:opacity-50");
  });

  it("applies required attribute", () => {
    render(<Input required />);
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  it("applies base styling classes", () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId("input");

    expect(input.className).toContain("flex");
    expect(input.className).toContain("h-9");
    expect(input.className).toContain("w-full");
    expect(input.className).toContain("rounded-md");
    expect(input.className).toContain("border");
    expect(input.className).toContain("shadow-sm");
  });

  it("merges custom classNames", () => {
    render(<Input className="custom-input" data-testid="input" />);
    const input = screen.getByTestId("input");

    expect(input.className).toContain("custom-input");
    // Should still have base classes
    expect(input.className).toContain("flex");
  });

  it("passes through HTML attributes", () => {
    render(
      <Input
        id="test-input"
        name="testName"
        maxLength={50}
        minLength={3}
        aria-label="Test input"
      />
    );

    const input = screen.getByLabelText("Test input");
    expect(input).toHaveAttribute("id", "test-input");
    expect(input).toHaveAttribute("name", "testName");
    expect(input).toHaveAttribute("maxLength", "50");
    expect(input).toHaveAttribute("minLength", "3");
  });

  it("supports ref forwarding", () => {
    const ref = { current: null as HTMLInputElement | null };

    render(<Input ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("handles focus events", () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();

    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);

    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalled();

    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalled();
  });

  it("displays placeholder text", () => {
    render(<Input placeholder="Search..." />);

    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search...").className
    ).toContain("placeholder:text-muted-foreground");
  });

  it("shows default value", () => {
    render(<Input defaultValue="initial value" />);
    expect(screen.getByRole("textbox")).toHaveValue("initial value");
  });

  it("works as controlled input", () => {
    const handleChange = vi.fn();
    const { rerender } = render(<Input value="controlled" onChange={handleChange} />);

    expect(screen.getByRole("textbox")).toHaveValue("controlled");

    rerender(<Input value="updated" onChange={handleChange} />);
    expect(screen.getByRole("textbox")).toHaveValue("updated");
  });
});
