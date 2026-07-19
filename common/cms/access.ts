import type { Access, FieldAccess } from "payload";

export const isAuthenticated: Access = ({ req }) => Boolean(req.user);

export const isAdmin: Access = ({ req }) =>
  req.user?.collection === "users" && req.user.role === "admin";

export const isCustomer: FieldAccess = ({ req }) => req.user?.collection === "customers";

export const isDocumentOwner: Access = ({ req }) => {
  if (req.user?.collection === "users" && req.user.role === "admin") {
    return true;
  }

  if (req.user?.collection === "customers") {
    return {
      customer: {
        equals: req.user.id,
      },
    };
  }

  return false;
};

export const adminOnlyFieldAccess: FieldAccess = ({ req }) =>
  req.user?.collection === "users" && req.user.role === "admin";

export const adminOrPublishedStatus: Access = ({ req }) => {
  if (req.user?.collection === "users" && req.user.role === "admin") {
    return true;
  }

  return {
    _status: {
      equals: "published",
    },
  };
};
