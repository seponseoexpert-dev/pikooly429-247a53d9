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
    <section ref={ref} className="py-10 md:py-14 section-container" aria-label="Frequently Asked Questions">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-sm">
            Everything you need to know about our services
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqItems.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border/50 rounded-xl px-4 bg-card data-[state=open]:border-primary/30 transition-all"
            >
              <AccordionTrigger className="text-sm md:text-base font-medium text-foreground hover:no-underline py-4 [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-secondary text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-left">{item.question}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4 pl-10 leading-relaxed">
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
