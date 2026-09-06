import { Link } from '@/router/Router';
import { StampBadge } from '@/components/StampBadge';
import { ArrowRight } from 'lucide-react';

export function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-ink text-bone py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-body text-xs uppercase tracking-widest text-accent mb-4">
            About Deadstock
          </p>
          <h1 className="font-display text-5xl md:text-7xl uppercase leading-[0.9] mb-6">
            We don't sell clothes.
            <br />
            We sell what's left.
          </h1>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          <div className="md:col-span-2 space-y-6">
            <p className="font-body text-base leading-relaxed">
              Deadstock started in a damp basement in Pune with three garbage bags of old
              clothes and a camera phone. No investors, no warehouse, no supply chain. Just
              one question: why does every resale platform look like a luxury boutique when
              the clothes come from a thrift rack?
            </p>
            <p className="font-body text-base leading-relaxed">
              Every piece we list is a single physical unit. We photograph it honestly —
              the stains, the fading, the repairs. We grade the condition in plain language.
              When it sells, it's gone. No restock notification, no waitlist, no "back soon."
              That's the point.
            </p>
            <p className="font-body text-base leading-relaxed">
              We're not trying to be the biggest. We're trying to be the most honest. If a
              jacket has a hole in the pocket, we'll tell you about the hole. If a shoe has
              been worn twice, we'll say twice — not "like new, barely worn." Condition
              isn't a marketing category here. It's the truth.
            </p>
          </div>
          <div className="hidden md:flex justify-center items-start pt-8">
            <StampBadge text="Est. 2026" subtext="Pune · India" size="md" variant="accent" />
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-ink text-bone border-y-2 border-ink py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl uppercase mb-8">What we stand on</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'One of one',
                body: 'Every item is a single unit. When it sells, it is removed from circulation. No reproductions.',
              },
              {
                title: 'Honest condition',
                body: 'Three grades: like new, good condition, well worn. We tell you exactly what you are getting.',
              },
              {
                title: 'Fair resale',
                body: 'We price based on what a piece is worth, not what we think someone will pay. No artificial scarcity.',
              },
              {
                title: '10-minute lock',
                body: 'When you add to bag, the item is yours for 10 minutes. Nobody else can buy it while you decide.',
              },
            ].map((p) => (
              <div key={p.title} className="border-2 border-bone/20 p-5">
                <h3 className="font-display text-xl uppercase mb-2 text-accent">{p.title}</h3>
                <p className="font-body text-sm text-bone/60 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="font-display text-4xl md:text-5xl uppercase mb-4">
          Ready to dig through the racks?
        </h2>
        <p className="font-body text-sm text-muted mb-8">
          New pieces drop regularly. Once they're gone, they're gone.
        </p>
        <Link to="/shop" className="btn btn-primary">
          Shop the drop
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
