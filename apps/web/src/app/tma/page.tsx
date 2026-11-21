import { TelegramMiniAppSurface } from "../../components/TelegramMiniAppSurface";
import { OnItStoreProvider } from "../../context/OnItStore";

export default function TelegramMiniAppPage() {
  return (
    <OnItStoreProvider initialSurface="tma">
      <TelegramMiniAppSurface standalone />
    </OnItStoreProvider>
  );
}
