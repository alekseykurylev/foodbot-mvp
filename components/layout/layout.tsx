import classes from "./layout.module.css";

export function Layout(props: React.ComponentProps<"div">) {
  return <div className={classes.layout} {...props} />;
}

export function Main(props: React.ComponentProps<"main">) {
  return <main className={classes.main} {...props} />;
}
