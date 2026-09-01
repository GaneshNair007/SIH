import React from "react";
import { render, screen } from "@testing-library/react";

function SampleComponent({ title }: { title: string }) {
  return (
    <div data-testid="sample-container" className="p-4 bg-slate-900 text-white">
      <h1 data-testid="sample-title">{title}</h1>
      <p>Industrial H2S Safety Platform</p>
    </div>
  );
}

describe("SampleComponent Rendering Test", () => {
  it("renders title and content correctly with React Testing Library", () => {
    render(<SampleComponent title="Active Telemetry" />);
    expect(screen.getByTestId("sample-container")).toBeInTheDocument();
    expect(screen.getByTestId("sample-title")).toHaveTextContent("Active Telemetry");
    expect(screen.getByText("Industrial H2S Safety Platform")).toBeInTheDocument();
  });
});
