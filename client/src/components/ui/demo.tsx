import DishOrbitCarousel, {
  type DishOrbitCarouselProps,
} from '@/components/ui/dish-orbit-carousel'

/** App-facing usage of the supplied component; the page supplies actual recipes. */
export default function FeaturedRecipeCarousel(props: DishOrbitCarouselProps) {
  return <DishOrbitCarousel {...props} scrollDriven={false} />
}
