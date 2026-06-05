from __future__ import annotations


class MLBTransformer:  # pragma: no cover - exercised only while unpickling joblib artifacts
    """Legacy transformer class required by the saved sklearn preprocessor.

    The notebook pickled this class from `__main__`. Before loading the joblib
    file we register this class on `sys.modules["__main__"]`, so unpickling can
    resolve the old reference without changing the artifact.
    """

    def __init__(self) -> None:
        from sklearn.preprocessing import MultiLabelBinarizer

        self.mlb = MultiLabelBinarizer(sparse_output=False)

    def fit(self, x, y=None):
        self.mlb.fit(x)
        return self

    def transform(self, x):
        return self.mlb.transform(x)

    def get_feature_names_out(self, input_features=None):
        import numpy as np

        return np.array([c for c in self.mlb.classes_])
