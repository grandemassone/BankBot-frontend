import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("signup", "pages/signup/index.tsx"),
    route("login", "pages/login/index.tsx"),
    route("chat", "pages/chat/index.tsx"),
] satisfies RouteConfig;