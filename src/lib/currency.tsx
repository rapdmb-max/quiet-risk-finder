import { createContext, useContext } from "react";
import type { Currency } from "@/data/accounts";

const CurrencyContext = createContext<Currency>("EUR");
export const CurrencyProvider = CurrencyContext.Provider;
export const useCurrency = () => useContext(CurrencyContext);
