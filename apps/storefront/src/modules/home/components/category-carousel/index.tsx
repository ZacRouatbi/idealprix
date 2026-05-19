import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import { HERO_IMAGE } from "@/lib/data/products";

interface Category {
  id: string;
  title: string;
  handle: string;
  image: string;
  count: number;
}

interface CategoryCarouselProps {
  categories: Category[];
}

const SLIDE_COUNT = 3;

export default function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const maxSlide = Math.max(0, categories.length - SLIDE_COUNT);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(Math.max(0, Math.min(index, maxSlide)));
  }, [maxSlide]);

  const goToPrevious = useCallback(() => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(maxSlide, prev + 1));
  }, [maxSlide]);

  if (categories.length === 0) return null;

  const visibleCategories = categories.slice(currentSlide, currentSlide + SLIDE_COUNT);

  return (
    <section className="bg-[#F0F3FA] w-full">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="relative">
          {/* Navigation arrows */}
          <button
            onClick={goToPrevious}
            disabled={currentSlide === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors border border-[#E5E5E5] disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous categories"
          >
            <ChevronLeft className="w-5 h-5 text-[#1E1E1E]" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentSlide === maxSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors border border-[#E5E5E5] disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next categories"
          >
            <ChevronRight className="w-5 h-5 text-[#1E1E1E]" />
          </button>

          {/* Carousel track */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {visibleCategories.map((cat) => (
                  <Link
                    key={cat.handle}
                    to={`/products?category=${cat.handle}`}
                    className="group block relative overflow-hidden rounded-2xl border border-[#E5E5E5] hover:shadow-md transition-shadow"
                  >
                    {/* Category image as header/background */}
                    <div className="relative h-32 w-full">
                      <img
                        src={cat.image}
                        alt={cat.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <h3 className="absolute bottom-3 left-4 font-semibold text-white text-lg" style={{ fontFamily: "Poppins, sans-serif" }}>
                        {cat.title}
                      </h3>
                    </div>
                    {/* Product count at bottom */}
                    <div className="bg-white px-4 py-2.5">
                      <p className="text-xs text-[#717182]">
                        {cat.count} produit{cat.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots indicator */}
          {categories.length > SLIDE_COUNT && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: maxSlide + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-[#D4302A] w-6"
                      : "bg-[#717182] hover:bg-[#1E1E1E]"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
