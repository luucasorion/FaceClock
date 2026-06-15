import cv2
import numpy as np

from deepface import DeepFace
from scipy.spatial.distance import cosine


class FacialService:

    def __init__(self, model_name: str = "ArcFace"):
        self.model_name = model_name

    def gerar_embedding(
        self,
        image_bytes: bytes
    ) -> list[float]:

        np_array = np.frombuffer(
            image_bytes,
            np.uint8
        )

        imagem = cv2.imdecode(
            np_array,
            cv2.IMREAD_COLOR
        )

        if imagem is None:
            raise ValueError(
                "Imagem inválida"
            )

        result = DeepFace.represent(
            img_path=imagem,
            model_name=self.model_name,
            enforce_detection=True
        )

        if not result:
            raise ValueError(
                "Nenhum rosto detectado na imagem"
            )

        return result[0]["embedding"]

    def calcular_similaridade(
        self,
        embedding_1: list[float],
        embedding_2: list[float]
    ) -> float:

        distancia = cosine(
            embedding_1,
            embedding_2
        )

        similaridade = 1 - distancia

        return float(similaridade)

    def validar_rosto(
        self,
        embedding_1: list[float],
        embedding_2: list[float],
        limiar: float = 0.4
    ) -> bool:

        similaridade = self.calcular_similaridade(
            embedding_1,
            embedding_2
        )

        return similaridade >= limiar