import { createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import { MedplumClient } from "@medplum/core";
import { MedplumProvider } from "@medplum/react";
import "@medplum/react/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useNavigate } from "react-router";
import { App } from "./App";
import { getConfig } from "./config";

const medplum = new MedplumClient({
  onUnauthenticated: () => {
    window.location.href = "/";
  },
  baseUrl: getConfig().baseUrl,
});

const theme = createTheme({
  headings: {
    sizes: {
      h1: {
        fontSize: "1.125rem",
        fontWeight: "500",
        lineHeight: "2.0",
      },
    },
  },
  fontSizes: {
    xs: "0.6875rem",
    sm: "0.875rem",
    md: "0.875rem",
    lg: "1.0rem",
    xl: "1.125rem",
  },
});

const AppWithRouter = () => {
  const navigate = useNavigate();
  return (
    <MedplumProvider medplum={medplum} navigate={navigate}>
      <MantineProvider theme={theme}>
        <App />
      </MantineProvider>
    </MedplumProvider>
  );
};

const container = document.getElementById("root") as HTMLDivElement;
const root = createRoot(container);
root.render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL || ""}>
      <AppWithRouter />
    </BrowserRouter>
  </StrictMode>
);
