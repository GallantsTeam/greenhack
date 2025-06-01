export default function Footer() {
  return (
    <footer className="bg-card shadow-sm mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ShopWave. All rights reserved.</p>
        <p className="text-sm">Powered by Next.js & Firebase</p>
      </div>
    </footer>
  );
}
