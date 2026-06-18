import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StudentQuickAddForm } from "../StudentQuickAddForm";

describe("StudentQuickAddForm", () => {
  it("submits valid values via the onSubmit handler", async () => {
    const onSubmit = vi.fn();
    render(<StudentQuickAddForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: "Lovelace" } });
    fireEvent.change(screen.getByLabelText(/Admission/i), { target: { value: "ADM-001" } });
    fireEvent.change(screen.getByLabelText(/Guardian phone/i), { target: { value: "+254700000000" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Student/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      first_name: "Ada", last_name: "Lovelace", admission_number: "ADM-001",
      guardian_phone: "+254700000000",
    });
  });

  it("blocks submission when required fields are empty", async () => {
    const onSubmit = vi.fn();
    render(<StudentQuickAddForm onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: /Add Student/i }));
    await waitFor(() => expect(screen.getByText(/First name required/i)).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });
});