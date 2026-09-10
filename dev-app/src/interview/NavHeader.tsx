import { useInterview } from "@imminently/interview-ui";
import { clearSelection } from "./selection";

/** Breadcrumb shown above the interview once it has loaded. "Home" returns to the picker. */
export const NavHeader = ({ interview }: { interview: string }) => {
  const { state } = useInterview();
  if (state !== "success") return null;

  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    clearSelection();
    window.location.reload();
  };

  return (
    <div className="px-4 py-2 border-b border-gray-200 text-sm text-gray-500">
      <a href="/" onClick={goHome}>
        Home
      </a>
      <span className="mx-2">/</span>
      <span className="text-foreground font-semibold">{interview}</span>
    </div>
  );
};
