import { PrototypeShell } from "../components/PrototypeShell";
import { OnItStoreProvider } from "../context/OnItStore";

export default function HomePage() {
  return (
    <OnItStoreProvider initialSurface="web">
      <PrototypeShell />
    </OnItStoreProvider>
  );
}
