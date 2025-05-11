// app/layout.tsx - alterações

import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { integradorService } from "@/lib/integrador-service";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HB Inventory",
  description: "Sistema de gerenciamento e controle de inventário de ativos",
  generator: 'v0.dev'
}

// Inicialização do integrador em um componente cliente
function IntegradorInitializer() {
  React.useEffect(() => {
    // Inicializar o serviço de integrador apenas uma vez no cliente
    integradorService.initialize().catch(error => {
      console.error("Erro ao inicializar integrador:", error);
    });
    
    // Log para confirmar inicialização
    console.log("Componente de inicialização do integrador montado");
    
    return () => {
      console.log("Componente de inicialização do integrador desmontado");
      // Não paramos o integrador aqui para manter a integração ativa
    };
  }, []);
  
  return null; // Componente não renderiza nada
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <SidebarProvider>
            <div className="flex h-screen">
              <AppSidebar />
              <div className="flex-1 overflow-auto">{children}</div>
            </div>
            <Toaster position="top-right" />
            {/* Componente que inicializa o integrador de forma segura no lado do cliente */}
            <IntegradorInitializer />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}