"use client";

import { Bounce, ToastContainer } from "react-toastify";

export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      transition={Bounce}
      toastClassName={(context) =>
        `osun-toast osun-toast--${context?.type ?? "default"}`
      }
    />
  );
}