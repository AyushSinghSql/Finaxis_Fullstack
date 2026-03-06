// import React from "react";
// import logo from "../assets/logo.png";

// function TopBar({ name, onLogout }) {
//   return (
//     <div className="w-full sticky top-0 z-30 flex items-center justify-between px-2 py-1 bg-gradient">
//       <h2 className="text-base sm:text-lg md:text-2xl tracking-wide text-white">
//         FinAxis
//       </h2>
//       <div className="flex items-center gap-4">
//         {/* <span className="text-xl font-semibold text-white">{name}</span> */}
      
//                   <img
//                     src={logo}   // put your logo path here
//                     alt="Sumaria Systems"
//                     className="h-8 w-40"
//                   />
               
//       </div>
//       <div className="flex items-center gap-4">
//         <span className="text-xl font-semibold text-white">{name}</span>
//         <span
//           className="cursor-pointer text-white text-2xl flex items-center"
//           title="Log out"
//           onClick={onLogout}
//         >
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//             width={28}
//             height={28}
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
//             />
//           </svg>
//         </span>
//       </div>
//     </div>
//   );
// }

// export default TopBar;

import React from "react"
import logo from "../assets/logo.png"

function TopBar({ fullName = "", onLogout }) {
  return (
    <header className="w-full border-b border-border bg-[#0F3A46] text-white">
      <div className="mx-auto flex h-12 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: logo + app name */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide">
            <span className="font-bold">Revolve</span> FinAxis
          </span>         
        </div>
        <div className="flex items-center gap-4"> 
                   <img
                     src={logo}   // put your logo path here
                     alt="Sumaria Systems"
                     className="h-30 w-40"
                   />       
      </div>

        {/* Right: user name + logout */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-100">
            {fullName}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-md border border-white/20 px-3 py-1 text-xs font-medium text-white hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default TopBar
