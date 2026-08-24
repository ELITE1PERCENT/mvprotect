import { SEO } from "@/components/SEO";
import { PageTransition, useCinematicVariants, cinematicEase } from "@/lib/animations";
import { motion, useReducedMotion } from "framer-motion";
import { useCreateQuoteRequest } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail, Clock, Loader2 } from "lucide-react";
import { QuoteRequestInputService } from "@workspace/api-zod";
import { Link } from "wouter";
import { useContentBlock } from "@/hooks/useContentBlock";

const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  email: z.string().email("Adresse email invalide"),
  service: z.enum([
    QuoteRequestInputService.nettoyage,
    QuoteRequestInputService.polissage,
    QuoteRequestInputService.ppf,
    QuoteRequestInputService.covering,
    QuoteRequestInputService.autre
  ], { required_error: "Veuillez sélectionner un service" }),
  message: z.string().min(10, "Votre message est trop court"),
  marketingConsent: z.boolean(),
});

type ContactFormValues = z.infer<typeof contactSchema>;
export default function Contact() {
  const { toast } = useToast();
  const createQuote = useCreateQuoteRequest();
  const contactSubtitle = useContentBlock("contact.hero.subtitle", "Discutons de votre projet. Chaque véhicule nécessite une approche unique, nos devis sont donc 100% personnalisés après étude de vos besoins.");
  const phone = useContentBlock("contact.phone", "+33382561062");
  const phoneDisplay = useContentBlock("contact.phone_display", "+33 3 82 56 10 62");
  const email = useContentBlock("contact.email", "contact@mvprotect.fr");
  const address = useContentBlock("footer.address", "4 Rue du Canal, 57970 Basse-Ham");

  const infoItems = [
    {
      icon: MapPin,
      label: "Studio",
      content: <p className="text-base text-muted-foreground leading-relaxed">{address}<br/><span className="text-sm opacity-80">(Sur rendez-vous uniquement)</span></p>,
    },
    {
      icon: Phone,
      label: "Téléphone",
      content: <a href={`tel:${phone}`} className="text-base text-foreground font-bold hover:text-primary transition-colors block mt-1">{phoneDisplay}</a>,
    },
    {
      icon: Mail,
      label: "Email",
      content: <a href={`mailto:${email}`} className="text-base text-muted-foreground hover:text-primary transition-colors block mt-1">{email}</a>,
    },
    {
      icon: Clock,
      label: "Horaires",
      content: <p className="text-base text-muted-foreground leading-relaxed">Lun - Ven : 09:00 - 19:00<br/>Samedi : Sur demande</p>,
    },
  ];
  const { fadeUp, staggerContainer } = useCinematicVariants();
  const shouldReduceMotion = useReducedMotion();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      service: undefined,
      message: "",
      marketingConsent: false,
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    createQuote.mutate({ data }, {
      onSuccess: () => {
        toast({
          title: "Demande envoyée avec succès",
          description: "Nous vous recontacterons dans les plus brefs délais pour établir votre devis.",
        });
        form.reset();
      },
      onError: () => {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'envoi de votre demande. Veuillez réessayer.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <PageTransition className="flex flex-col w-full py-32 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <SEO 
        title="Contact & Devis" 
        description="Demandez votre devis personnalisé pour un detailing, polissage ou protection PPF. Prenez rendez-vous dans notre studio." 
      />

      <div className="container px-4 max-w-7xl mx-auto relative z-10">
        {/* Title */}
        <motion.div
          className="text-center mb-24"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tighter text-foreground mb-6">
            Contactez <span className="text-gradient-chrome">L'Atelier</span>
          </h1>
          <p className="font-sans text-muted-foreground max-w-2xl mx-auto text-xl leading-relaxed">
            {contactSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
          {/* Info Side — slides from left */}
          <motion.div
            className="space-y-8 lg:col-span-1"
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: cinematicEase }}
          >
            <div className="bg-card border-t-4 border-t-primary border border-border p-10 shadow-xl">
              <h3 className="text-2xl font-heading font-bold uppercase tracking-widest text-foreground mb-10 border-b border-border pb-4">Informations</h3>
              
              <motion.div
                className="space-y-10 font-sans"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                {infoItems.map((item) => (
                  <motion.div
                    key={item.label}
                    variants={{ hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: cinematicEase } } }}
                    className="flex items-start gap-5 group"
                  >
                    <div className="w-12 h-12 bg-background border border-border flex items-center justify-center shrink-0 group-hover:border-primary transition-colors shadow-sm">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading font-bold uppercase tracking-wider text-foreground mb-1 text-sm">{item.label}</p>
                      {item.content}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            
            <motion.div
              className="bg-background border-l-4 border-l-primary p-8 shadow-sm hidden lg:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: cinematicEase }}
            >
              <p className="font-heading font-bold uppercase tracking-widest text-sm text-primary mb-3">Service Premium</p>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">Une réponse vous sera apportée sous 24h ouvrées. Pour les demandes urgentes, privilégiez le contact téléphonique.</p>
            </motion.div>
          </motion.div>

          {/* Form Side — slides from right */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: cinematicEase }}
          >
            <div className="bg-card border-t-4 border-t-accent border border-border p-6 sm:p-10 md:p-16 shadow-2xl">
              <h3 className="text-3xl font-heading font-bold uppercase tracking-widest text-foreground mb-10 border-b border-border pb-4">Demander un <span className="text-primary">Devis</span></h3>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-foreground text-sm uppercase tracking-wider">Nom / Prénom</FormLabel>
                        <FormControl><Input placeholder="Jean Dupont" className="bg-background border-border h-14 text-base px-4 rounded-none" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-foreground text-sm uppercase tracking-wider">Téléphone</FormLabel>
                        <FormControl><Input placeholder="06 00 00 00 00" type="tel" className="bg-background border-border h-14 text-base px-4 rounded-none" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-foreground text-sm uppercase tracking-wider">Email</FormLabel>
                        <FormControl><Input placeholder="jean@exemple.com" type="email" className="bg-background border-border h-14 text-base px-4 rounded-none" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="service" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-foreground text-sm uppercase tracking-wider">Service souhaité</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border h-14 text-base px-4 rounded-none">
                              <SelectValue placeholder="Sélectionnez un service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-none border-border">
                            <SelectItem value="nettoyage">Nettoyage Complet</SelectItem>
                            <SelectItem value="polissage">Polissage & Céramique</SelectItem>
                            <SelectItem value="ppf">Protection PPF</SelectItem>
                            <SelectItem value="covering">Covering</SelectItem>
                            <SelectItem value="autre">Autre / Conseil</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="message" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-foreground text-sm uppercase tracking-wider">Modèle du véhicule et détails de la demande</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Porsche 911 992 noire, je souhaite corriger quelques micro-rayures et poser une céramique..." 
                          className="min-h-[180px] bg-background border-border resize-none text-base p-4 rounded-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="marketingConsent" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-4 space-y-0 bg-background border border-border p-6 shadow-sm hover:border-primary/30 transition-colors">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1 data-[state=checked]:bg-primary w-5 h-5 rounded-none" />
                      </FormControl>
                      <div className="space-y-2 leading-none">
                        <FormLabel className="font-bold cursor-pointer text-base text-foreground">J'accepte de recevoir des offres et actualités de MV PROTECT</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground leading-relaxed">Facultatif. Vous pouvez vous désinscrire à tout moment.</FormDescription>
                      </div>
                    </FormItem>
                  )} />

                  <div className="pt-10 border-t border-border flex flex-col md:flex-row items-center gap-8 justify-between">
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                      Les données personnelles communiquées sont traitées par MV PROTECT afin de gérer votre demande de devis. Pour en savoir plus sur la gestion de vos données et vos droits, consultez notre <Link href="/politique-confidentialite" className="text-primary hover:text-accent transition-colors font-medium">Politique de confidentialité</Link>.
                    </p>
                    <motion.button
                      type="submit"
                      className="w-full md:w-auto px-12 py-5 text-sm btn-chrome shrink-0 shadow-xl shadow-primary/20"
                      disabled={createQuote.isPending}
                      whileHover={!createQuote.isPending ? { scale: 1.03 } : {}}
                      whileTap={!createQuote.isPending ? { scale: 0.97 } : {}}
                    >
                      <span className="flex items-center justify-center gap-3">
                        {createQuote.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> ENVOI EN COURS...</> : "ENVOYER LA DEMANDE"}
                      </span>
                    </motion.button>
                  </div>

                </form>
              </Form>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
