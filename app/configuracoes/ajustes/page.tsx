"use client"

import { useState } from "react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Bell, Moon, Palette, Save, Sun, User, TestTube } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TestesTab } from "@/components/testes-tab"

export default function AjustesPage() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("aparencia")
  const [isLoading, setIsLoading] = useState(false)

  // Configurações de aparência
  const [accentColor, setAccentColor] = useState("default")
  const [borderRadius, setBorderRadius] = useState("default")
  const [animationsEnabled, setAnimationsEnabled] = useState(true)

  // Configurações de notificações
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true)
  const [notificacaoInventario, setNotificacaoInventario] = useState(true)
  const [notificacaoContagem, setNotificacaoContagem] = useState(true)
  const [notificacaoTransito, setNotificacaoTransito] = useState(true)
  const [notificacaoRelatorio, setNotificacaoRelatorio] = useState(true)
  const [posicaoNotificacao, setPosicaoNotificacao] = useState("top-right")

  // Configurações de usuário
  const [nomeUsuario, setNomeUsuario] = useState("Administrador")
  const [emailUsuario, setEmailUsuario] = useState("admin@hbinventory.com")
  const [cargoUsuario, setCargoUsuario] = useState("Gerente de Inventário")

  const handleSaveSettings = async () => {
    setIsLoading(true)

    try {
      // Simular um atraso para mostrar o estado de carregamento
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast.success("Configurações salvas com sucesso!")
    } catch (error) {
      toast.error("Erro ao salvar configurações")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Ajustes do Sistema</h1>
            <p className="text-muted-foreground">Personalize a aparência e o comportamento do sistema</p>
         </div>

         <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
           <Button onClick={handleSaveSettings} disabled={isLoading} className="flex items-center gap-2">
             {isLoading ? (
               <>
                 <svg
                   className="animate-spin -ml-1 mr-2 h-4 w-4"
                   xmlns="http://www.w3.org/2000/svg"
                   fill="none"
                   viewBox="0 0 24 24"
                 >
                   <circle
                     className="opacity-25"
                     cx="12"
                     cy="12"
                     r="10"
                     stroke="currentColor"
                     strokeWidth="4"
                   ></circle>
                   <path
                     className="opacity-75"
                     fill="currentColor"
                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                   ></path>
                 </svg>
                 Salvando...
               </>
             ) : (
               <>
                 <Save className="h-4 w-4" />
                 Salvar Configurações
               </>
             )}
           </Button>
         </motion.div>
       </div>

       <Tabs value={activeTab} onValueChange={setActiveTab}>
         <TabsList className="grid grid-cols-4 mb-4">
           <TabsTrigger value="aparencia">
             <Palette className="h-4 w-4 mr-2" />
             Aparência
           </TabsTrigger>
           <TabsTrigger value="notificacoes">
             <Bell className="h-4 w-4 mr-2" />
             Notificações
           </TabsTrigger>
           <TabsTrigger value="usuario">
             <User className="h-4 w-4 mr-2" />
             Usuário
           </TabsTrigger>
           <TabsTrigger value="testes">
             <TestTube className="h-4 w-4 mr-2" />
             Testes
           </TabsTrigger>
         </TabsList>

         <TabsContent value="aparencia">
           <Card>
             <CardHeader>
               <CardTitle>Configurações de Aparência</CardTitle>
               <CardDescription>Personalize a aparência visual do sistema</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="space-y-2">
                 <h3 className="text-sm font-medium">Tema</h3>
                 <div className="flex flex-wrap gap-4">
                   <div
                     className={`flex flex-col items-center gap-2 cursor-pointer ${
                       theme === "light" ? "opacity-100" : "opacity-50 hover:opacity-80"
                     }`}
                     onClick={() => setTheme("light")}
                   >
                     <div className="w-20 h-20 bg-white border rounded-md flex items-center justify-center">
                       <Sun className="h-8 w-8 text-amber-500" />
                     </div>
                     <span className="text-sm">Claro</span>
                   </div>

                   <div
                     className={`flex flex-col items-center gap-2 cursor-pointer ${
                       theme === "dark" ? "opacity-100" : "opacity-50 hover:opacity-80"
                     }`}
                     onClick={() => setTheme("dark")}
                   >
                     <div className="w-20 h-20 bg-slate-900 border rounded-md flex items-center justify-center">
                       <Moon className="h-8 w-8 text-slate-400" />
                     </div>
                     <span className="text-sm">Escuro</span>
                   </div>

                   <div
                     className={`flex flex-col items-center gap-2 cursor-pointer ${
                       theme === "system" ? "opacity-100" : "opacity-50 hover:opacity-80"
                     }`}
                     onClick={() => setTheme("system")}
                   >
                     <div className="w-20 h-20 bg-gradient-to-br from-white to-slate-900 border rounded-md flex items-center justify-center">
                       <div className="flex">
                         <Sun className="h-8 w-8 text-amber-500" />
                         <Moon className="h-8 w-8 text-slate-400 -ml-2" />
                       </div>
                     </div>
                     <span className="text-sm">Sistema</span>
                   </div>
                 </div>
               </div>

               <div className="space-y-2">
                 <h3 className="text-sm font-medium">Cor de destaque</h3>
                 <RadioGroup value={accentColor} onValueChange={setAccentColor} className="flex flex-wrap gap-4">
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="default" id="color-default" />
                     <Label htmlFor="color-default" className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-accent" />
                       Padrão
                     </Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="orange" id="color-orange" />
                     <Label htmlFor="color-orange" className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-orange-500" />
                       Laranja
                     </Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="amber" id="color-amber" />
                     <Label htmlFor="color-amber" className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-amber-500" />
                       Âmbar
                     </Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="emerald" id="color-emerald" />
                     <Label htmlFor="color-emerald" className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-emerald-500" />
                       Esmeralda
                     </Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="blue" id="color-blue" />
                     <Label htmlFor="color-blue" className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-blue-500" />
                       Azul
                     </Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="violet" id="color-violet" />
                     <Label htmlFor="color-violet" className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-violet-500" />
                       Violeta
                     </Label>
                   </div>
                 </RadioGroup>
               </div>

               <div className="space-y-2">
                 <h3 className="text-sm font-medium">Raio da borda</h3>
                 <RadioGroup value={borderRadius} onValueChange={setBorderRadius} className="flex flex-wrap gap-4">
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="none" id="radius-none" />
                     <Label htmlFor="radius-none" className="flex items-center gap-2">
                       <div className="w-5 h-5 bg-accent" />
                       Nenhum
                     </Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="small" id="radius-small" />
                     <Label htmlFor="radius-small" className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-sm bg-accent" />
                       Pequeno
                     </Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="default" id="radius-default" />
                     <Label htmlFor="radius-default" className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded bg-accent" />
                       Padrão
                     </Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="large" id="radius-large" />
                     <Label htmlFor="radius-large" className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-lg bg-accent" />
                       Grande
                     </Label>
                   </div>
                 </RadioGroup>
               </div>

               <div className="flex items-center space-x-2">
                 <Switch
                   id="animations"
                   checked={animationsEnabled}
                   onCheckedChange={setAnimationsEnabled}
                 />
                 <Label htmlFor="animations">Habilitar animações</Label>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="notificacoes">
           <Card>
             <CardHeader>
               <CardTitle>Configurações de Notificações</CardTitle>
               <CardDescription>Gerencie como e quando receber notificações</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="flex items-center space-x-2">
                 <Switch
                   id="notificacoes-ativas"
                   checked={notificacoesAtivas}
                   onCheckedChange={setNotificacoesAtivas}
                 />
                 <Label htmlFor="notificacoes-ativas">Habilitar todas as notificações</Label>
               </div>

               <div className="space-y-4 pl-6">
                 <div className="flex items-center space-x-2">
                   <Switch
                     id="notificacao-inventario"
                     checked={notificacaoInventario}
                     onCheckedChange={setNotificacaoInventario}
                     disabled={!notificacoesAtivas}
                   />
                   <Label htmlFor="notificacao-inventario">Notificações de inventário</Label>
                 </div>

                 <div className="flex items-center space-x-2">
                   <Switch
                     id="notificacao-contagem"
                     checked={notificacaoContagem}
                     onCheckedChange={setNotificacaoContagem}
                     disabled={!notificacoesAtivas}
                   />
                   <Label htmlFor="notificacao-contagem">Notificações de contagem</Label>
                 </div>

                 <div className="flex items-center space-x-2">
                   <Switch
                     id="notificacao-transito"
                     checked={notificacaoTransito}
                     onCheckedChange={setNotificacaoTransito}
                     disabled={!notificacoesAtivas}
                   />
                   <Label htmlFor="notificacao-transito">Notificações de trânsito</Label>
                 </div>

                 <div className="flex items-center space-x-2">
                   <Switch
                     id="notificacao-relatorio"
                     checked={notificacaoRelatorio}
                     onCheckedChange={setNotificacaoRelatorio}
                     disabled={!notificacoesAtivas}
                   />
                   <Label htmlFor="notificacao-relatorio">Notificações de relatório</Label>
                 </div>
               </div>

               <div className="space-y-2">
                 <Label htmlFor="posicao-notificacao">Posição das notificações</Label>
                 <Select value={posicaoNotificacao} onValueChange={setPosicaoNotificacao}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="top-left">Superior esquerda</SelectItem>
                     <SelectItem value="top-right">Superior direita</SelectItem>
                     <SelectItem value="bottom-left">Inferior esquerda</SelectItem>
                     <SelectItem value="bottom-right">Inferior direita</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="usuario">
           <Card>
             <CardHeader>
               <CardTitle>Configurações de Usuário</CardTitle>
               <CardDescription>Gerencie suas informações pessoais e de perfil</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="space-y-2">
                 <Label htmlFor="nome-usuario">Nome completo</Label>
                 <Input
                   id="nome-usuario"
                   value={nomeUsuario}
                   onChange={(e) => setNomeUsuario(e.target.value)}
                   placeholder="Digite seu nome completo"
                 />
               </div>

               <div className="space-y-2">
                 <Label htmlFor="email-usuario">E-mail</Label>
                 <Input
                   id="email-usuario"
                   type="email"
                   value={emailUsuario}
                   onChange={(e) => setEmailUsuario(e.target.value)}
                   placeholder="Digite seu e-mail"
                 />
               </div>

               <div className="space-y-2">
                 <Label htmlFor="cargo-usuario">Cargo</Label>
                 <Input
                   id="cargo-usuario"
                   value={cargoUsuario}
                   onChange={(e) => setCargoUsuario(e.target.value)}
                   placeholder="Digite seu cargo"
                 />
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="testes">
           <TestesTab />
         </TabsContent>
       </Tabs>
     </div>
   </div>
 )
}