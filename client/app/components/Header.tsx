import { Link } from "react-router";

export const Header = () => {
  return (
    <header className="py-[20px] border-b mb-[20px]">
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex gap-[10px] items-center">
          <img className="h-[40px]" src="logo.svg" alt="" />
          <span className="text-2xl font-bold">AudioBookTube</span>
        </Link>
        <Link to="settings" className="i-simple-line-icons-settings">
          Settings
        </Link>
      </div>
    </header>
  );
};
