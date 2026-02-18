import { faqItems } from "@/data/mockData";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-12 md:py-16 section-container" aria-label="Frequently Asked Questions">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">Everything you need to know about Pikooly</p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqItems.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border/50 rounded-xl px-5 bg-card data-[state=open]:border-primary/30 data-[state=open]:shadow-sm transition-all"
            >
              <AccordionTrigger className="text-sm md:text-base font-medium text-foreground hover:text-primary py-4 [&[data-state=open]>svg]:rotate-180">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;