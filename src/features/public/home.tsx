import About from "./about";
import Projects from "./projects";
import Contact from "./contact";
import Gallery from "./gallery";

export default function Home() {
  return (
    <>
      <div id="about" className="relative z-10 scroll-mt-[56px] md:scroll-mt-[56px]">
        <About />
      </div><br /><br /><br /><br />
      <section id="projects" className="text-white pt-10">
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-16 md:pt-6">
          <Projects />
        </div>
      </section>
      <section id="gallery" className="text-white pt-10">
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-16 md:pt-6">
          <Gallery />
        </div>
      </section>
      <div id="contact" className="relative z-10 scroll-mt-[56px] md:scroll-mt-[56px]">
        <Contact />
      </div>
    </>
  );
}
