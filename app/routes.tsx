import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"), // La tua rotta "/"
    route("signup", "pages/signup/index.tsx")
] satisfies RouteConfig;