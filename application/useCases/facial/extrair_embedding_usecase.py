from deepface import DeepFace


class ExtrairEmbeddingUseCase:
    def __init__(self, model_name: str = "Facenet"):
        self.model_name = model_name

    def execute(self, image_bytes: bytes) -> list[float]:
        result = DeepFace.represent(
            img_path=image_bytes,
            model_name=self.model_name,
            enforce_detection=True
        )

        if not result:
            raise ValueError("Nenhum rosto detectado na imagem")

        return result[0]["embedding"]