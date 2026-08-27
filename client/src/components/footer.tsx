const Footer = () => {
  return (
    <footer className="py-8 relative z-10">
      <p className="text-center text-xs tracking-wider font-medium text-emerald-200/80">
        © {new Date().getFullYear()} VIVA. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
