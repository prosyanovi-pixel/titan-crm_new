
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FEATURE_DASHBOARD?: string;
  readonly VITE_FEATURE_CONTRACTORS?: string;
  readonly VITE_FEATURE_PROJECTS?: string;
  readonly VITE_FEATURE_CONTRACTS?: string;
  readonly VITE_FEATURE_TASKS?: string;
  readonly VITE_FEATURE_MAIL?: string;
  readonly VITE_FEATURE_DOCUMENTS?: string;
  readonly VITE_FEATURE_LAWYERS?: string;
  readonly VITE_FEATURE_CALENDAR?: string;
  readonly VITE_FEATURE_FINANCE?: string;
  readonly VITE_FEATURE_SETTINGS?: string;
  readonly VITE_FEATURE_PROFILE?: string;
  readonly VITE_FEATURE_WORKFLOWS?: string;
  readonly VITE_FEATURE_MARKETING?: string;
  readonly VITE_FEATURE_REPORTS?: string;
  readonly VITE_FEATURE_PRODUCTS?: string;
  readonly VITE_FEATURE_TEMPLATES?: string;
  readonly VITE_FEATURE_WAREHOUSE?: string;
  readonly VITE_FEATURE_SERVICES?: string;
  readonly VITE_FEATURE_TRASH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'react-router-dom' {
  import * as React from 'react';

  export interface BrowserRouterProps {
    basename?: string;
    children?: React.ReactNode;
    window?: Window;
  }
  export class BrowserRouter extends React.Component<BrowserRouterProps, unknown> {}

  export interface RoutesProps {
    children?: React.ReactNode;
    location?: unknown;
  }
  export class Routes extends React.Component<RoutesProps, unknown> {}

  export interface RouteProps {
    caseSensitive?: boolean;
    children?: React.ReactNode;
    element?: React.ReactNode | null;
    index?: boolean;
    path?: string;
  }
  export class Route extends React.Component<RouteProps, unknown> {}

  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string | object;
    replace?: boolean;
    state?: unknown;
    preventScrollReset?: boolean;
    relative?: "route" | "path";
  }
  export const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;

  export interface NavLinkProps extends Omit<LinkProps, "className" | "style" | "children"> {
    className?: string | ((props: { isActive: boolean; isPending: boolean }) => string | undefined);
    style?: React.CSSProperties | ((props: { isActive: boolean; isPending: boolean }) => React.CSSProperties | undefined);
    children?: React.ReactNode | ((props: { isActive: boolean; isPending: boolean }) => React.ReactNode);
    end?: boolean;
  }
  export const NavLink: React.ForwardRefExoticComponent<NavLinkProps & React.RefAttributes<HTMLAnchorElement>>;

  export function useLocation(): {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
    key: string;
  };

  export interface NavigateFunction {
    (to: string | object, options?: { replace?: boolean; state?: unknown; preventScrollReset?: boolean; relative?: "route" | "path" }): void;
    (delta: number): void;
  }
  export function useNavigate(): NavigateFunction;

  export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T;

  export function useSearchParams(defaultInit?: URLSearchParams | string | string[][] | Record<string, string> | undefined): [
    URLSearchParams,
    (
      nextInit:
        | URLSearchParams
        | string
        | string[][]
        | Record<string, string>
        | ((prev: URLSearchParams) => URLSearchParams),
      navigateOptions?: { replace?: boolean; state?: unknown }
    ) => void,
  ];
}

declare module '@xyflow/react/dist/style.css' {
  // CSS module import - no exports
}