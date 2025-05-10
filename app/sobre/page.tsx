"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function SobrePage() {
  const technologies = [
    { name: "Next.js", description: "Framework React com App Router" },
    { name: "TypeScript", description: "Tipagem estática para JavaScript" },
    { name: "Tailwind CSS", description: "Framework CSS utilitário" },
    { name: "Framer Motion", description: "Biblioteca de animações para React" },
    { name: "Sonner", description: "Sistema de notificações toast" },
    { name: "shadcn/ui", description: "Componentes de interface reutilizáveis" },
    { name: "Zustand", description: "Gerenciamento de estado" },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold mb-2">Sobre o HB Inventory</h1>
        <p className="text-muted-foreground mb-8">Sistema de gerenciamento e controle de inventário de ativos</p>
      </motion.div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Descrição do Projeto</CardTitle>
            <CardDescription>Visão geral do sistema HB Inventory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              O HB Inventory é um sistema web desenvolvido para gerenciar e controlar o inventário de ativos realizado
              mensalmente dentro de um Centro de Distribuição (CD), com apoio de lojas, regionais e fornecedores.
            </p>
            <p>
              O sistema permite o registro de contagens, acompanhamento de ativos em trânsito, integração com
              fornecedores e geração de relatórios comparativos, facilitando o controle e a gestão do inventário.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tecnologias Utilizadas</CardTitle>
            <CardDescription>Stack tecnológica do projeto</CardDescription>
          </CardHeader>
          <CardContent>
            <motion.ul
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {technologies.map((tech, index) => (
                <motion.li key={tech.name} variants={itemVariants}>
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{tech.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{tech.description}</p>
                    </CardContent>
                  </Card>
                </motion.li>
              ))}
            </motion.ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
            <CardDescription>Detalhes técnicos e versão</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h3 className="font-medium">Versão</h3>
                <p className="text-muted-foreground">1.0.0</p>
              </div>
              <div>
                <h3 className="font-medium">Data da última atualização</h3>
                <p className="text-muted-foreground">10 de Maio de 2025</p>
              </div>
              <div>
                <h3 className="font-medium">Desenvolvido por</h3>
                <p className="text-muted-foreground">Equipe HB Inventory</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Funcionalidades principais</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Gerenciamento de inventários</li>
                <li>Registro de contagens por lojas, setores e fornecedores</li>
                <li>Controle de ativos em trânsito</li>
                <li>Relatórios comparativos</li>
                <li>Integração com sistemas externos</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
