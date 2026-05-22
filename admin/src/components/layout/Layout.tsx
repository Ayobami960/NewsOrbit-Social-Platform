// import { useState } from "react";
// import type { ReactNode } from "react";
// import Sidebar from "./Sidebar";
// import { Menu } from "lucide-react";

// interface LayoutProps {
//   title: string;
//   children: ReactNode;
//   action?: ReactNode;
// }

// export default function Layout({ title, children, action }: LayoutProps) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   return (
//     <div className="flex min-h-screen bg-zinc-950">
//       <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col min-h-screen lg:ml-60">
//         {/* Topbar */}
//         <header className="sticky top-0 z-40 h-16 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/80 flex items-center px-6 gap-4">
//           {/* Hamburger Menu - Mobile Only */}
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="lg:hidden text-zinc-400 hover:text-white"
//           >
//             <Menu size={24} />
//           </button>

//           <h1 className="font-[Playfair_Display] text-[17px] font-semibold text-zinc-100 flex-1">
//             {title}
//           </h1>

//           {action && <div className="flex items-center gap-2">{action}</div>}
//         </header>

//         {/* Main Content Area */}
//         <main className="flex-1 p-6 overflow-y-auto">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }



import { useState } from "react";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

interface LayoutProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export default function Layout({ title, children, action }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar overlay — mobile only */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-60 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-14 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/60 flex items-center px-4 sm:px-6 gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <h1 className="font-[Playfair_Display] text-[16px] sm:text-[17px] font-semibold text-zinc-100 flex-1 truncate">
            {title}
          </h1>

          {action && (
            <div className="flex items-center gap-2 shrink-0">{action}</div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}