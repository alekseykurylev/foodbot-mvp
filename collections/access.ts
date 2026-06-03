import type { Access } from "payload";

export const isAuthenticated: Access = ({ req }) => Boolean(req.user);

export const isAdmin: Access = ({ req }) => req.user?.role === "admin";
