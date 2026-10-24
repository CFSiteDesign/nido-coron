import * as Accordion from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { FAQS, chatLink } from "@/data/expedition";
import { Reveal } from "./Reveal";

export function Faq() {
  const chat = chatLink();
  return (
    <section id="faq" aria-labelledby="faq-title" className="bg-sand px-3 py-20 md:px-6 md:py-28">
      <div className="mx-auto grid max-w-[1320px] grid-cols-12 gap-y-10 md:gap-x-10">
        <Reveal className="col-span-12 md:col-span-4">
          <div className="md:sticky md:top-32">
            <p className="kicker text-lapis">FAQ</p>
            <h2 id="faq-title" className="display mt-2 text-[clamp(2.9rem,7vw,6.4rem)]">
              Good questions
            </h2>
            <p className="mt-4 max-w-xs leading-relaxed text-midnight/80">
              Can't see yours? Ask us. A real human on the team will answer.
            </p>
            <a href={chat.href} target="_blank" rel="noreferrer" className="btn-ghost mt-6">
              {chat.label}
            </a>
          </div>
        </Reveal>

        <Reveal className="col-span-12 md:col-span-8">
          <Accordion.Root type="single" collapsible className="border-t-2 border-midnight">
            {FAQS.map((f, i) => (
              <Accordion.Item key={f.q} value={`q${i}`} className="border-b border-midnight/20">
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left text-lg font-bold tracking-tight md:py-6 md:text-xl">
                    {f.q}
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream transition-colors group-hover:bg-powder-soft group-data-[state=open]:bg-midnight group-data-[state=open]:text-cream">
                      <Plus className="size-4 transition-transform duration-300 group-data-[state=open]:rotate-45" />
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <p className="max-w-[44rem] pb-6 pr-12 leading-relaxed text-midnight/80">{f.a}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </Reveal>
      </div>
    </section>
  );
}
