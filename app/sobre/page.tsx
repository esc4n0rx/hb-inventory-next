"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { Code, Database, FileJson, Globe, Info, Package, Palette, RotateCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function SobrePage() {
  const [activeTab, setActiveTab] = useState("visao-geral")
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.2])
  
  const technologies = [
    { name: "Next.js", description: "Framework React com App Router", icon: <Globe className="h-8 w-8 text-blue-500" /> },
    { name: "TypeScript", description: "Tipagem estática para JavaScript", icon: <Code className="h-8 w-8 text-blue-600" /> },
    { name: "Tailwind CSS", description: "Framework CSS utilitário", icon: <Palette className="h-8 w-8 text-cyan-500" /> },
    { name: "Framer Motion", description: "Biblioteca de animações para React", icon: <RotateCcw className="h-8 w-8 text-purple-500" /> },
    { name: "Sonner", description: "Sistema de notificações toast", icon: <Info className="h-8 w-8 text-amber-500" /> },
    { name: "shadcn/ui", description: "Componentes de interface reutilizáveis", icon: <Package className="h-8 w-8 text-green-500" /> },
    { name: "Zustand", description: "Gerenciamento de estado", icon: <Database className="h-8 w-8 text-red-500" /> },
    { name: "Supabase", description: "Banco de dados e autenticação", icon: <FileJson className="h-8 w-8 text-emerald-500" /> },
  ]

  const features = [
    {
      name: "Gerenciamento de inventários",
      description: "Crie, gerencie e finalize inventários com total controle sobre o processo.",
      color: "bg-blue-500/10 border-blue-500/20 text-blue-500"
    },
    {
      name: "Registro de contagens",
      description: "Registre contagens por lojas, setores e fornecedores com interface intuitiva.",
      color: "bg-amber-500/10 border-amber-500/20 text-amber-500"
    },
    {
      name: "Controle de ativos em trânsito",
      description: "Acompanhe ativos em movimento entre CDs e locais de armazenamento.",
      color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500"
    },
    {
      name: "Relatórios comparativos",
      description: "Visualize e compare dados de inventários diferentes para análise de tendências.",
      color: "bg-purple-500/10 border-purple-500/20 text-purple-500"
    },
    {
      name: "Integração com contagem",
      description: "Captura automática de dados de contagem para evitar erros manuais.",
      color: "bg-green-500/10 border-green-500/20 text-green-500"
    },
    {
      name: "Dashboard em tempo real",
      description: "Acompanhe o andamento do inventário em tempo real com visualizações detalhadas.",
      color: "bg-red-500/10 border-red-500/20 text-red-500"
    }
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

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      } 
    },
  }

  const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <motion.div 
        style={{ opacity }}
        className="relative pt-16 pb-24 md:pt-24 md:pb-32" // Removido overflow-hidden para o glow ser visível, ajuste se necessário
      >
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-20 h-20 bg-accent/10 rounded-2xl p-4 mx-auto mb-6 flex items-center justify-center"
            >
              <Package className="h-10 w-10 text-accent" />
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text bg-gradient-to-r from-accent to-blue-500"
            >
              HB Inventory
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Sistema completo para gerenciamento e controle de inventário de ativos com monitoramento em tempo real
            </motion.p>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap justify-center gap-3"
            >
              <Badge variant="outline" className="py-1 px-3 text-sm">Versão 1.0.0</Badge>
              <Badge variant="outline" className="py-1 px-3 text-sm">Maio 2025</Badge>
              <Badge variant="outline" className="py-1 px-3 text-sm">CD Pavuna</Badge>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Efeito de Glow Modificado */}
        <div 
          className="absolute -bottom-2 left-0 right-0 h-8 bg-gradient-to-t from-transparent via-blue-500/20 to-transparent blur-md"
          style={{ zIndex: 5 }} 
        ></div>
        <div 
          className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background via-blue-400/10 to-transparent opacity-50 blur-lg"
          style={{ zIndex: 4 }} 
        ></div>
      </motion.div>
      
      <div className="container mx-auto px-4 pb-20 relative z-10"> {/* Adicionado relative z-10 para garantir que o conteúdo fique acima do glow de fundo se necessário */}
        <div className="grid gap-12">
          <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeInUpVariants}
            className="relative"
          >
            <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-accent/30 to-transparent"></div>
            
            <Card className="border bg-card/50 backdrop-blur-sm">
              {/* CardHeader Modificado para maior visibilidade do aviso */}
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Info className="h-7 w-7 text-blue-500" /> {/* Ícone maior e cor alterada */}
                  Visão Geral do Projeto
                </CardTitle>
                <CardDescription className="text-base pt-1">Entenda o propósito e a missão do HB Inventory</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <motion.div 
                    variants={fadeInUpVariants}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-medium">O que é o HB Inventory?</h3>
                    <p className="text-muted-foreground">
                      O HB Inventory é um sistema web desenvolvido para gerenciar e controlar o inventário de ativos realizado
                      mensalmente dentro do CD Pavuna, com apoio de lojas, regionais e fornecedores.
                    </p>
                    <p className="text-muted-foreground">
                      Com uma interface moderna e intuitiva, o sistema simplifica o processo de contagem, oferecendo visualização
                      em tempo real do andamento do inventário e facilitando a tomada de decisões.
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    variants={fadeInUpVariants}
                    className="space-y-4 p-6 rounded-xl bg-accent/5 border border-accent/10"
                  >
                    <h3 className="text-lg font-medium">Por que usar o HB Inventory?</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-accent"></div>
                        <span className="text-muted-foreground">Redução de erros manuais em até 87%</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-accent"></div>
                        <span className="text-muted-foreground">Aumento de produtividade da equipe em 43%</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-accent"></div>
                        <span className="text-muted-foreground">Economia de tempo em processos de 65%</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-accent"></div>
                        <span className="text-muted-foreground">Integração simplificada com sistemas existentes</span>
                      </li>
                    </ul>
                  </motion.div>
                </div>
                
                <Separator className="my-6" />
                
                <motion.div variants={fadeInUpVariants}>
                  <h3 className="text-lg font-medium mb-4">Principais Funcionalidades</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                      <motion.div
                        key={feature.name}
                        variants={itemVariants}
                        className={`p-4 rounded-lg border ${feature.color} space-y-2`}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      >
                        <h4 className="font-medium">{feature.name}</h4>
                        <p className="text-sm opacity-90">{feature.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainerVariants}
            className="relative"
          >
            <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/30 to-transparent"></div>
            
            <Card className="border bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-500" />
                  Stack Tecnológica
                </CardTitle>
                <CardDescription className="text-base">Tecnologias modernas utilizadas no desenvolvimento</CardDescription>
              </CardHeader>
            
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
              
              <CardContent>
                <motion.ul
                  variants={containerVariants}
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                  {technologies.map((tech) => (
                    <motion.li 
                      key={tech.name} 
                      variants={itemVariants}
                      whileHover={{ 
                        scale: 1.03, 
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                        transition: { duration: 0.2 } 
                      }}
                    >
                      <Card className="h-full border hover:border-blue-500/20 transition-colors">
                        <CardHeader className="pb-2 pt-6">
                          <div className="mb-2">{tech.icon}</div>
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
          </motion.div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUpVariants}
            className="relative"
          >
            <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/30 to-transparent"></div>
            
            <Card className="border bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-amber-500" />
                  Informações do Sistema
                </CardTitle>
                <CardDescription className="text-base">Detalhes técnicos e versão atual</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                <div className="grid gap-4 md:grid-cols-3">
                  <motion.div 
                    variants={itemVariants}
                    className="p-6 rounded-xl border bg-gradient-to-br from-amber-500/5 to-transparent hover:from-amber-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                      <h3 className="font-medium">Versão</h3>
                    </div>
                    <p className="text-xl font-bold">1.0.0</p>
                    <p className="text-xs text-muted-foreground mt-1">Lançada em maio de 2025</p>
                  </motion.div>
                  
                  <motion.div 
                    variants={itemVariants}
                    className="p-6 rounded-xl border bg-gradient-to-br from-amber-500/5 to-transparent hover:from-amber-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                      <h3 className="font-medium">Última atualização</h3>
                    </div>
                    <p className="text-xl font-bold">10 de Maio de 2025</p>
                    <p className="text-xs text-muted-foreground mt-1">Atualização do módulo de relatórios</p>
                  </motion.div>
                  
                  <motion.div 
                    variants={itemVariants}
                    className="p-6 rounded-xl border bg-gradient-to-br from-amber-500/5 to-transparent hover:from-amber-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                      <h3 className="font-medium">Desenvolvido por</h3>
                    </div>
                    <p className="text-xl font-bold">Paulo Oliveira</p>
                  </motion.div>
                </div>
                
                <Separator />
                
                <motion.div variants={fadeInUpVariants} className="pt-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Próximas atualizações</h3>
                      <p className="text-sm text-muted-foreground max-w-lg">
                        Nossa equipe está trabalhando constantemente para melhorar o sistema.
                        Fique atento às próximas novidades!
                      </p>
                    </div>
                    
                    <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      Ver Changelog
                    </Button>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="py-10 border-t border-accent/10 mt-12"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium">HB Inventory</span>
              <span className="text-xs text-muted-foreground">© 2025</span>
            </div>
            
            <div className="flex items-center gap-6">
              <motion.a 
                href="#" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                Documentação
              </motion.a>
              <motion.a 
                href="#" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                Suporte
              </motion.a>
              <motion.a 
                href="#" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                Contato
              </motion.a>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}